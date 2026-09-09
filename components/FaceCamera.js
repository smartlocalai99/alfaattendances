import { useEffect, useRef, useState } from 'react';
import { captureFace, loadModels } from '@/lib/faceRecognition';
import { faceDistance } from '@/lib/faceDescriptor';

const SCAN_DELAY = 300;
const REQUIRED_FRAMES = 3;
const MAX_FRAME_DISTANCE = 0.32;

function friendlyMessage(error) {
  const message = error?.message || 'Unable to detect a face.';
  if (message.includes('Multiple faces')) return 'Multiple faces detected. Keep only one face in the guide.';
  if (message.includes('No face')) return 'Position your face inside the guide.';
  if (message.includes('center')) return 'Position your face inside the guide.';
  if (message.includes('small')) return 'Move closer so your face fills the guide.';
  if (message.includes('blur')) return 'Face quality is poor. Hold still and adjust focus.';
  if (message.includes('exposed') || message.includes('lighting')) return 'Face quality is poor. Please adjust lighting.';
  if (message.includes('unstable')) return 'Improving image quality... Please hold still.';
  return message;
}

function framesAreStable(frames) {
  for (let first = 0; first < frames.length; first += 1) {
    for (let second = first + 1; second < frames.length; second += 1) {
      if (faceDistance(frames[first], frames[second]) > MAX_FRAME_DISTANCE) return false;
    }
  }
  return true;
}

export default function FaceCamera({ onCapture, successMessage = 'Face detected. Ready to save.', readyMessage = 'Position your face inside the guide.', processingMessage = 'Improving image quality...' }) {
  const video = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const completed = useRef(false);
  const scanning = useRef(false);
  const frames = useRef([]);
  const captureSequence = useRef(0);
  const [message, setMessage] = useState('Starting camera...');

  useEffect(() => {
    let mounted = true;
    const session = ++captureSequence.current;
    completed.current = false;
    scanning.current = false;
    frames.current = [];

    async function scan() {
      if (!mounted || session !== captureSequence.current || completed.current || scanning.current) return;
      if (!video.current || video.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timer.current = window.setTimeout(scan, 100);
        return;
      }
      scanning.current = true;
      try {
        const capture = await captureFace(video.current);
        if (!mounted || session !== captureSequence.current) return;
        frames.current.push(capture.descriptor);
        if (process.env.NODE_ENV !== 'production') {
          console.info('Face capture accepted', { faceCount: capture.faceCount, box: capture.box, embeddingLength: capture.descriptor.length, embeddingValid: capture.validEmbedding, quality: capture.quality });
        }
        if (frames.current.length < REQUIRED_FRAMES) {
          setMessage(`Face detected. Improving image quality... ${frames.current.length}/${REQUIRED_FRAMES}`);
          return;
        }
        if (!framesAreStable(frames.current)) {
          frames.current = [];
          throw new Error('Face capture is unstable. Please hold still.');
        }
        const capturedFrames = [...frames.current];
        frames.current = [];
        setMessage(processingMessage);
        const result = await onCapture(capturedFrames);
        if (!mounted || session !== captureSequence.current) return;
        completed.current = true;
        setMessage(result?.duplicate ? 'This face is already linked to an enrolled teacher.' : successMessage);
      } catch (error) {
        frames.current = [];
        if (mounted && session === captureSequence.current) setMessage(friendlyMessage(error));
      } finally {
        scanning.current = false;
        if (mounted && session === captureSequence.current && !completed.current) timer.current = window.setTimeout(scan, SCAN_DELAY);
      }
    }

    async function startCamera() {
      try {
        await loadModels();
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable.');
        stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
        if (!video.current) return;
        video.current.srcObject = stream.current;
        await video.current.play();
        if (!mounted || session !== captureSequence.current) return;
        setMessage(readyMessage);
        timer.current = window.setTimeout(scan, 300);
      } catch (error) {
        if (!mounted || session !== captureSequence.current) return;
        setMessage(error?.name === 'NotAllowedError' ? 'Camera permission is required.' : /404|fetch/i.test(error?.message || '') ? 'Face models are missing.' : 'Camera unavailable. Please check your device camera.');
      }
    }

    startCamera();
    return () => {
      mounted = false;
      captureSequence.current += 1;
      window.clearTimeout(timer.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      frames.current = [];
    };
  }, [onCapture, successMessage, readyMessage, processingMessage]);

  return <div className="face-camera">
    <video className="face-camera__video" muted playsInline ref={video} />
    <div className="face-camera__guide" aria-hidden="true">
      <span className="face-camera__guide-corner face-camera__guide-corner--top-left" />
      <span className="face-camera__guide-corner face-camera__guide-corner--top-right" />
      <span className="face-camera__guide-corner face-camera__guide-corner--bottom-left" />
      <span className="face-camera__guide-corner face-camera__guide-corner--bottom-right" />
    </div>
    <p className="face-camera__message" aria-live="polite">{message}</p>
  </div>;
}
