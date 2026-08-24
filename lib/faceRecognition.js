const MODEL_URL = '/models';
let ready = false;
let faceapiModule = null;

async function faceapi() {
  if (!faceapiModule) faceapiModule = await import('face-api.js');
  return faceapiModule;
}

export async function loadModels() {
  if (ready) return;
  const api = await faceapi();
  await Promise.all([
    api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  ready = true;
}

export async function descriptor(video) {
  const api = await faceapi();
  const faces = await api
    .detectAllFaces(video, new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (!faces.length) throw new Error('No face detected. Please move closer.');
  if (faces.length > 1) throw new Error('Multiple faces detected. Only one person should be visible.');
  const box = faces[0].detection.box;
  if (faces[0].detection.score < 0.55 || box.width < 72 || box.height < 72) {
    throw new Error('Face is too small or unclear. Please move slightly closer.');
  }
  return Array.from(faces[0].descriptor);
}
