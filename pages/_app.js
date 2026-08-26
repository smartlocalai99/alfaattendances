import "@/styles/globals.css";
import Head from 'next/head';
import { useRouter } from 'next/router';
import PwaMetadata from '@/components/PwaMetadata';

export default function App({ Component, pageProps }) {
  const { pathname } = useRouter();
  const pwa = pathname === '/dashboard'
    ? { name: 'Admin', manifest: '/dashboard/manifest.webmanifest', serviceWorker: '/dashboard/pwa-sw.js', scope: '/dashboard' }
    : pathname === '/attendance'
      ? { name: 'Attendances', manifest: '/attendance/manifest.webmanifest', serviceWorker: '/attendance/pwa-sw.js', scope: '/attendance' }
      : null;

  return <><Head><meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></Head>{pwa && <PwaMetadata {...pwa} />}<Component {...pageProps} /></>;
}
