// import { useEffect, useRef, useState } from 'react';
// import { descriptor, loadModels } from '@/lib/faceRecognition';

// const retryDelay = 650;

// function friendlyMessage(error) {
//   const message = error?.message || 'Unable to detect a face.';
//   if (message.includes('Multiple faces')) return 'Please keep only one face in the camera.';
//   if (message.includes('No face') || message.includes('too small') || message.includes('unclear')) return 'Detecting Face... Keep one clear face inside the guide.';
//   if (message.includes('Face not recognized')) return 'Face Not Recognized. Look straight at the camera and try again.';
//   return message;
// }

// export default function FaceCamera({
//   onCapture,
//   successMessage = 'Face Recognized',
//   readyMessage = 'Detecting Face...',
//   processingMessage = 'Verifying...',
// }) {
//   const video = useRef(null);
//   const stream = useRef(null);
//   const timer = useRef(null);
//   const completed = useRef(false);
//   const scanning = useRef(false);
//   const [message, setMessage] = useState('Starting Camera...');

//   useEffect(() => {
//     let mounted = true;

//     async function scan() {
//       if (!mounted || completed.current || scanning.current) return;
//       if (video.current?.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
//         timer.current = window.setTimeout(scan, 100);
//         return;
//       }

//       scanning.current = true;
//       try {
//         const faceDescriptor = await descriptor(video.current);
//         if (!mounted) return;
//         setMessage('Face Detected');
//         await new Promise((resolve) => window.requestAnimationFrame(resolve));
//         if (!mounted) return;
//         setMessage(processingMessage);
//         await onCapture(faceDescriptor);
//         if (!mounted) return;
//         completed.current = true;
//         setMessage(successMessage);
//       } catch (error) {
//         if (mounted) setMessage(friendlyMessage(error));
//       } finally {
//         scanning.current = false;
//         if (mounted && !completed.current) timer.current = window.setTimeout(scan, retryDelay);
//       }
//     }

//     async function startCamera() {
//       try {
//         await loadModels();
//         stream.current = await navigator.mediaDevices.getUserMedia({
//           video: {
//             facingMode: 'user',
//             width: { ideal: 1280, min: 640 },
//             height: { ideal: 720, min: 480 },
//             frameRate: { ideal: 24, max: 30 },
//           },
//           audio: false,
//         });
//         video.current.srcObject = stream.current;
//         await video.current.play();
//         if (!mounted) return;
//         setMessage(readyMessage);
//         timer.current = window.setTimeout(scan, 50);
//       } catch (error) {
//         if (!mounted) return;
//         setMessage(error.name === 'NotAllowedError' ? 'Camera permission is required.' : /404|fetch/i.test(error.message) ? 'Face models are missing.' : 'Camera unavailable. Please check your device camera.');
//       }
//     }

//     startCamera();
//     return () => {
//       mounted = false;
//       window.clearTimeout(timer.current);
//       stream.current?.getTracks().forEach((track) => track.stop());
//     };
//   }, [onCapture, successMessage, readyMessage, processingMessage]);

//   return <div className="face-camera">
//     <video className="face-camera__video" muted playsInline ref={video} />
//     <div className="face-camera__guide" aria-hidden="true">
//       <span className="face-camera__guide-corner face-camera__guide-corner--top-left" />
//       <span className="face-camera__guide-corner face-camera__guide-corner--top-right" />
//       <span className="face-camera__guide-corner face-camera__guide-corner--bottom-left" />
//       <span className="face-camera__guide-corner face-camera__guide-corner--bottom-right" />
//     </div>
//     <p className="face-camera__message" aria-live="polite">{message}</p>
//   </div>;
// }









import { useEffect, useRef, useState } from 'react';
import { descriptor, loadModels } from '@/lib/faceRecognition';

const RETRY_DELAY = 250;
const INITIAL_SCAN_DELAY = 50;

function friendlyMessage(error) {
  const message = error?.message || 'Unable to detect a face.';

  if (message.includes('Multiple faces')) {
    return 'Please keep only one face in the camera.';
  }

  if (
    message.includes('No face') ||
    message.includes('too small') ||
    message.includes('unclear')
  ) {
    return 'Detecting Face... Keep one clear face inside the guide.';
  }

  if (message.includes('Face not recognized')) {
    return 'Face Not Recognized. Look straight at the camera and try again.';
  }

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

  const mountedRef = useRef(true);
  const completed = useRef(false);
  const scanning = useRef(false);
  const verifying = useRef(false);

  const [message, setMessage] = useState(
    'Starting Camera...'
  );

  useEffect(() => {
    mountedRef.current = true;
    completed.current = false;
    scanning.current = false;
    verifying.current = false;

    async function scheduleScan(delay = RETRY_DELAY) {
      if (!mountedRef.current) return;
      if (completed.current) return;
      if (verifying.current) return;

      window.clearTimeout(timer.current);

      timer.current = window.setTimeout(
        scan,
        delay
      );
    }

    async function scan() {
      if (!mountedRef.current) return;
      if (completed.current) return;
      if (scanning.current) return;
      if (verifying.current) return;

      const currentVideo = video.current;

      if (!currentVideo) {
        scheduleScan(100);
        return;
      }

      if (
        currentVideo.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        scheduleScan(100);
        return;
      }

      scanning.current = true;

      try {
        /*
         * Get face descriptor.
         *
         * descriptor() should reject when:
         * - no face
         * - multiple faces
         * - face is too small
         * - face is unclear
         */
        const faceDescriptor =
          await descriptor(currentVideo);

        if (!mountedRef.current) return;

        /*
         * Stop scanning immediately while
         * the server verifies the face.
         */
        verifying.current = true;

        setMessage(processingMessage);

        /*
         * Send ONLY ONE request.
         */
        await onCapture(faceDescriptor);

        if (!mountedRef.current) return;

        completed.current = true;
        setMessage(successMessage);
      } catch (error) {
        if (!mountedRef.current) return;

        /*
         * If verification failed, allow scanning
         * again immediately.
         */
        verifying.current = false;

        setMessage(
          friendlyMessage(error)
        );

        scheduleScan(RETRY_DELAY);
      } finally {
        scanning.current = false;
      }
    }

    async function startCamera() {
      try {
        /*
         * Load face models first.
         */
        await loadModels();

        if (!mountedRef.current) return;

        /*
         * Start camera.
         */
        stream.current =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: 'user',
              },

              width: {
                ideal: 640,
                min: 480,
              },

              height: {
                ideal: 480,
                min: 360,
              },

              frameRate: {
                ideal: 30,
                max: 30,
              },
            },

            audio: false,
          });

        if (!mountedRef.current) {
          stream.current
            ?.getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        video.current.srcObject =
          stream.current;

        await video.current.play();

        if (!mountedRef.current) return;

        setMessage(readyMessage);

        /*
         * Start first scan immediately.
         */
        scheduleScan(INITIAL_SCAN_DELAY);
      } catch (error) {
        if (!mountedRef.current) return;

        console.error(
          'Camera error:',
          error
        );

        if (
          error?.name ===
          'NotAllowedError'
        ) {
          setMessage(
            'Camera permission is required.'
          );
        } else if (
          /404|fetch/i.test(
            error?.message || ''
          )
        ) {
          setMessage(
            'Face models are missing.'
          );
        } else {
          setMessage(
            'Camera unavailable. Please check your device camera.'
          );
        }
      }
    }

    startCamera();

    return () => {
      mountedRef.current = false;

      window.clearTimeout(
        timer.current
      );

      stream.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      stream.current = null;

      if (video.current) {
        video.current.srcObject = null;
      }
    };
  }, [
    onCapture,
    successMessage,
    readyMessage,
    processingMessage,
  ]);

  return (
    <div className="face-camera">
      <video
        className="face-camera__video"
        muted
        playsInline
        autoPlay
        ref={video}
      />

      <div
        className="face-camera__guide"
        aria-hidden="true"
      >
        <span className="face-camera__guide-corner face-camera__guide-corner--top-left" />

        <span className="face-camera__guide-corner face-camera__guide-corner--top-right" />

        <span className="face-camera__guide-corner face-camera__guide-corner--bottom-left" />

        <span className="face-camera__guide-corner face-camera__guide-corner--bottom-right" />
      </div>

      <p
        className="face-camera__message"
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  );
}