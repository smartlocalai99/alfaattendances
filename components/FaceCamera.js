import { useEffect, useRef, useState } from 'react';
import { descriptor, loadModels } from '@/lib/faceRecognition';

const retryDelay = 650;

function friendlyMessage(error) {
  const message = error?.message || 'Unable to detect a face.';
  if (message.includes('Multiple faces')) return 'Please keep only one face in the camera.';
  if (message.includes('No face') || message.includes('too small') || message.includes('unclear')) return 'Detecting Face... Keep one clear face inside the guide.';
  if (message.includes('Face not recognized')) return 'Face Not Recognized. Look straight at the camera and try again.';
  return message;
}

export default function FaceCamera({
  onCapture,
  successMessage = 'Face Recognized',
  readyMessage = 'Detecting Face...',
  processingMessage = 'Verifying...',
}) {
  const video = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const completed = useRef(false);
  const scanning = useRef(false);
  const [message, setMessage] = useState('Starting Camera...');

  useEffect(() => {
    let mounted = true;

    async function scan() {
      if (!mounted || completed.current || scanning.current) return;
      if (video.current?.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timer.current = window.setTimeout(scan, 100);
        return;
      }

      scanning.current = true;
      try {
        const faceDescriptor = await descriptor(video.current);
        if (!mounted) return;
        setMessage('Face Detected');
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
        if (!mounted) return;
        setMessage(processingMessage);
        await onCapture(faceDescriptor);
        if (!mounted) return;
        completed.current = true;
        setMessage(successMessage);
      } catch (error) {
        if (mounted) setMessage(friendlyMessage(error));
      } finally {
        scanning.current = false;
        if (mounted && !completed.current) timer.current = window.setTimeout(scan, retryDelay);
      }
    }

    async function startCamera() {
      try {
        await loadModels();
        stream.current = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: false,
        });
        video.current.srcObject = stream.current;
        await video.current.play();
        if (!mounted) return;
        setMessage(readyMessage);
        timer.current = window.setTimeout(scan, 50);
      } catch (error) {
        if (!mounted) return;
        setMessage(error.name === 'NotAllowedError' ? 'Camera permission is required.' : /404|fetch/i.test(error.message) ? 'Face models are missing.' : 'Camera unavailable. Please check your device camera.');
      }
    }

    startCamera();
    return () => {
      mounted = false;
      window.clearTimeout(timer.current);
      stream.current?.getTracks().forEach((track) => track.stop());
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
