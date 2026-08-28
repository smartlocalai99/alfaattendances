/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/pwa-sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/' }],
      },
      {
        source: '/dashboard/pwa-sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/dashboard' }],
      },
      {
        source: '/attendance/pwa-sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/attendance' }],
      },
    ];
  },
};

module.exports = nextConfig;
