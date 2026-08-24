const MODEL_URL = '/models';
let ready = false;

export async function loadModels() {
  if (ready) return;
  const faceapi = await import('face-api.js');
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  ready = true;
}

export async function descriptor(video) {
  const faceapi = await import('face-api.js');
  const faces = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (!faces.length) throw new Error('No face detected. Please move closer.');
  if (faces.length > 1) throw new Error('Multiple faces detected. Only one person should be visible.');
  const box = faces[0].detection.box;
  if (box.width < 100 || box.height < 100) throw new Error('Face is too small. Please move closer.');
  return Array.from(faces[0].descriptor);
}
