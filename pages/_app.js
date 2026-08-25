import "@/styles/globals.css";
import { useRouter } from 'next/router';
import PwaMetadata from '@/components/PwaMetadata';

export default function App({ Component, pageProps }) {
  const { pathname } = useRouter();
  const pwa = pathname === '/dashboard'
    ? { name: 'Admin', manifest: '/dashboard/manifest.webmanifest', serviceWorker: '/dashboard/pwa-sw.js', scope: '/dashboard' }
    : pathname === '/attendance'
      ? { name: 'Attendances', manifest: '/attendance/manifest.webmanifest', serviceWorker: '/attendance/pwa-sw.js', scope: '/attendance' }
      : null;

  return <>{pwa && <PwaMetadata {...pwa} />}<Component {...pageProps} /></>;
}
