/** @type {import('next').NextConfig} */
const nextConfig = {
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