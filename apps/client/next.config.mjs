/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental WebSocket proxying
  experimental: {
    websocketProxy: true
  },
  // Set up rewrites to proxy API and WebSocket requests
  async rewrites() {
    return [
      {
        source: '/ws/:path*',
        destination: 'http://backend:8000/ws/:path*' // Proxy websockets to the backend container
      }
    ];
  }
};

export default nextConfig;