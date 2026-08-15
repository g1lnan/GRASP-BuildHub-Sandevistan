import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep the native/heavy ingest libraries as Node externals rather than
  // bundling them into the server build (mammoth + pdf-parse pull large deps).
  serverExternalPackages: ['mammoth', 'pdf-parse'],
}

export default nextConfig
