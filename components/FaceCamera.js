import { useEffect, useRef, useState } from 'react';
import { descriptor, loadModels } from '@/lib/faceRecognition';

const retryDelay = 1600;

function friendlyMessage(error) {
  const message = error?.message || 'Unable to detect a face.';
  if (message.includes('Multiple faces')) return 'Please keep only one face in the camera.';
  if (message.includes('No face') || message.includes('too small')) return 'Camera ready. Keep one face clearly visible.';
  if (message.includes('Face not recognized')) return 'Face not enrolled. Please enroll the teacher first.';
  return message;
}

export default function FaceCamera({ onCapture, successMessage = 'Attendance marked successfully', readyMessage = 'Camera ready. Keep one face clearly visible.', processingMessage = 'Verifying face...' }) {
  const video = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const completed = useRef(false);
  const scanning = useRef(false);
  const [message, setMessage] = useState('Preparing face recognition…');

  useEffect(() => {
    let mounted = true;

    async function scan() {
      if (!mounted || completed.current || scanning.current || !video.current?.readyState) return;
      scanning.current = true;
      try {
        const faceDescriptor = await descriptor(video.current);
        if (!mounted) return;
        setMessage('Face detected');
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        if (!mounted) return;
        setMessage(processingMessage);
        await onCapture(faceDescriptor);
        if (!mounted) return;
        completed.current = true;
        setMessage(successMessage);
        return;
      } catch (error) {
        if (mounted) setMessage(friendlyMessage(error));
      } finally {
        scanning.current = false;
        if (mounted && !completed.current) timer.current = window.setTimeout(scan, retryDelay);
      }
    }

    (async () => {
      try {
        await loadModels();
        stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        video.current.srcObject = stream.current;
        await video.current.play();
        if (!mounted) return;
        setMessage(readyMessage);
        timer.current = window.setTimeout(scan, 400);
      } catch (error) {
        if (!mounted) return;
        setMessage(error.name === 'NotAllowedError' ? 'Camera permission is required.' : /404|fetch/i.test(error.message) ? 'Face models are missing.' : 'Camera unavailable. Please check your device camera.');
      }
    })();

    return () => {
      mounted = false;
      window.clearTimeout(timer.current);
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onCapture, successMessage, readyMessage, processingMessage]);

  return <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900"><video className="h-full w-full object-cover" muted playsInline ref={video}/><p className="absolute inset-x-3 bottom-3 m-0 rounded-lg bg-black/70 p-2 text-center text-sm text-white">{message}</p></div>;
}
