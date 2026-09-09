import { isFaceDescriptor } from '@/lib/faceDescriptor';

const MODEL_URL = '/models';
let ready = false;
let faceapiModule = null;
let modelsLoading = null;

async function faceapi() {
  if (!faceapiModule) faceapiModule = await import('face-api.js');
  return faceapiModule;
}

export async function loadModels() {
  if (ready) return;
  if (!modelsLoading) {
    modelsLoading = (async () => {
      const api = await faceapi();
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      ready = true;
    })();
  }
  try { await modelsLoading; } finally { modelsLoading = null; }
}

function imageQuality(video, box) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const padding = 0.12;
  const sourceX = Math.max(0, box.x - box.width * padding);
  const sourceY = Math.max(0, box.y - box.height * padding);
  const sourceWidth = Math.min(video.videoWidth - sourceX, box.width * (1 + padding * 2));
  const sourceHeight = Math.min(video.videoHeight - sourceY, box.height * (1 + padding * 2));
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 128, 128);
  const pixels = context.getImageData(0, 0, 128, 128).data;
  const luminance = new Float32Array(128 * 128);
  let total = 0;
  let bright = 0;
  let dark = 0;
  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * 4;
    const value = 0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2];
    luminance[index] = value;
    total += value;
    if (value >= 245) bright += 1;
    if (value <= 10) dark += 1;
  }
  let laplacianTotal = 0;
  let laplacianSquaredTotal = 0;
  let samples = 0;
  for (let y = 1; y < 127; y += 1) {
    for (let x = 1; x < 127; x += 1) {
      const index = y * 128 + x;
      const value = 4 * luminance[index] - luminance[index - 1] - luminance[index + 1] - luminance[index - 128] - luminance[index + 128];
      laplacianTotal += value;
      laplacianSquaredTotal += value * value;
      samples += 1;
    }
  }
  const sharpness = laplacianSquaredTotal / samples - (laplacianTotal / samples) ** 2;
  return { brightness: total / luminance.length, brightRatio: bright / luminance.length, darkRatio: dark / luminance.length, sharpness };
}

export async function captureFace(video) {
  const api = await faceapi();
  const faces = await api.detectAllFaces(video, new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.6 })).withFaceLandmarks().withFaceDescriptors();
  if (!faces.length) throw new Error('No face detected. Please position your face inside the guide.');
  if (faces.length > 1) throw new Error('Multiple faces detected. Only one person should be visible.');
  const face = faces[0];
  const box = face.detection.box;
  const width = video.videoWidth;
  const height = video.videoHeight;
  const centerX = (box.x + box.width / 2) / width;
  const centerY = (box.y + box.height / 2) / height;
  if (face.detection.score < 0.75) throw new Error('Face is too unclear. Please improve lighting.');
  if (box.width / width < 0.16 || box.height / height < 0.22) throw new Error('Face is too small. Please move closer.');
  if (Math.abs(centerX - 0.5) > 0.20 || Math.abs(centerY - 0.5) > 0.24) throw new Error('Center your face inside the guide.');
  const quality = imageQuality(video, box);
  if (quality.brightness > 220 || quality.brightRatio > 0.35 || quality.brightness < 35 || quality.darkRatio > 0.45) throw new Error('Face is severely overexposed or underexposed. Please adjust lighting.');
  if (quality.sharpness < 18) throw new Error('Face is too blurry. Please hold still and adjust focus.');
  const faceDescriptor = Array.from(face.descriptor);
  if (!isFaceDescriptor(faceDescriptor)) throw new Error('Face embedding is invalid. Please try again.');
  return {
    descriptor: faceDescriptor,
    faceCount: faces.length,
    box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
    quality: { brightness: Math.round(quality.brightness), brightRatio: Number(quality.brightRatio.toFixed(2)), darkRatio: Number(quality.darkRatio.toFixed(2)), sharpness: Math.round(quality.sharpness) },
    validEmbedding: true,
  };
}

export async function descriptor(video) {
  return (await captureFace(video)).descriptor;
}
