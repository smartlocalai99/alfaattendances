import "@/styles/globals.css";
import Head from 'next/head';
import PwaMetadata from '@/components/PwaMetadata';

export default function App({ Component, pageProps }) {
  return <>
    <Head>
      <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    </Head>
    <PwaMetadata
      manifest="/manifest.webmanifest"
      serviceWorker="/pwa-sw.js"
      scope="/"
    />
    <Component {...pageProps} />
  </>;
}
