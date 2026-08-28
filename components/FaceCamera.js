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

const SCAN_DELAY = 250;
const REQUIRED_FRAMES = 3;

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
    return 'Face Not Recognized. Please look directly at the camera.';
  }

  if (message.includes('match is not clear')) {
    return 'Face Not Recognized. Please look directly at the camera.';
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

  const completed = useRef(false);
  const scanning = useRef(false);
  const frames = useRef([]);

  const [message, setMessage] = useState(
    'Starting Camera...'
  );

  useEffect(() => {
    let mounted = true;

    async function scan() {
      if (
        !mounted ||
        completed.current ||
        scanning.current
      ) {
        return;
      }

      if (
        !video.current ||
        video.current.readyState <
          HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        timer.current = window.setTimeout(
          scan,
          100
        );
        return;
      }

      scanning.current = true;

      try {
        const faceDescriptor =
          await descriptor(video.current);

        if (!mounted) return;

        /*
         * Store several consecutive face descriptors.
         * This prevents one bad/blurry frame from
         * identifying the wrong person.
         */
        frames.current.push(faceDescriptor);

        if (
          frames.current.length <
          REQUIRED_FRAMES
        ) {
          setMessage(
            `Face Detected... ${frames.current.length}/${REQUIRED_FRAMES}`
          );

          return;
        }

        setMessage(processingMessage);

        /*
         * Send all stable frames to the server.
         */
        const capturedFrames = [
          ...frames.current,
        ];

        frames.current = [];

        await onCapture(capturedFrames);

        if (!mounted) return;

        completed.current = true;
        setMessage(successMessage);
      } catch (error) {
        frames.current = [];

        if (mounted) {
          setMessage(
            friendlyMessage(error)
          );
        }
      } finally {
        scanning.current = false;

        if (
          mounted &&
          !completed.current
        ) {
          timer.current =
            window.setTimeout(
              scan,
              SCAN_DELAY
            );
        }
      }
    }

    async function startCamera() {
      try {
        await loadModels();

        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            'Camera unavailable.'
          );
        }

        stream.current =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: 'user',

                width: {
                  ideal: 1280,
                  min: 640,
                },

                height: {
                  ideal: 720,
                  min: 480,
                },

                frameRate: {
                  ideal: 30,
                  max: 30,
                },
              },

              audio: false,
            }
          );

        if (!video.current) return;

        video.current.srcObject =
          stream.current;

        await video.current.play();

        if (!mounted) return;

        setMessage(readyMessage);

        timer.current =
          window.setTimeout(
            scan,
            300
          );
      } catch (error) {
        if (!mounted) return;

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
      mounted = false;

      window.clearTimeout(
        timer.current
      );

      stream.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });
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
