import Head from 'next/head';
import { useEffect } from 'react';

export default function PwaMetadata({ name, manifest, serviceWorker, scope }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(serviceWorker, { scope }).catch(() => {});
    }
  }, [scope, serviceWorker]);

  return (
    <Head>
      <title>{name}</title>
      <meta name="theme-color" content="#047857" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={name} />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <link rel="manifest" href={manifest} />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    </Head>
  );
}
