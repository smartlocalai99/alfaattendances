import { useEffect, useRef, useState } from 'react';
import { descriptor, loadModels } from '@/lib/faceRecognition';

export default function FaceCamera({ onCapture, label = 'ATTENDANCE' }) {
  const video = useRef(null);
  const stream = useRef(null);
  const [message, setMessage] = useState('Preparing face recognition…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadModels();
        stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        video.current.srcObject = stream.current;
        await video.current.play();
        if (mounted) setMessage('Camera ready. Keep one face clearly visible.');
      } catch (error) {
        if (!mounted) return;
        setMessage(error.name === 'NotAllowedError' ? 'Camera permission is required.' : /404|fetch/i.test(error.message) ? 'Face models are missing.' : 'Camera unavailable. Please check your device camera.');
      }
    })();
    return () => {
      mounted = false;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function capture() {
    setBusy(true);
    try {
      setMessage('Verifying face…');
      await onCapture(await descriptor(video.current));
      setMessage('Face verified successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const unavailable = message.includes('required') || message.includes('unavailable') || message.includes('missing');
  return <><div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900"><video className="h-full w-full object-cover" muted playsInline ref={video}/><p className="absolute inset-x-3 bottom-3 m-0 rounded-lg bg-black/70 p-2 text-center text-sm text-white">{message}</p></div><button className="btn-primary mt-4 w-full" disabled={busy || unavailable} onClick={capture}>{busy ? 'Verifying face…' : label}</button></>;
}
