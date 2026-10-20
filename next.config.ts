import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { uploadImagePatterns } from './src/lib/uploads'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Lets a phone on the same network load dev chunks from a .local hostname.
  // Development only.
  allowedDevOrigins: ['*.local'],
  images: {
    // One entry per image upload collection, derived rather than written out.
    // A missing entry is not a build failure: the page builds and then throws
    // on the first request that renders the image. uploads.test.ts guards it.
    localPatterns: uploadImagePatterns(),
  },
  async redirects() {
    return [
      // The Webflow site's URLs. /contact was its sign-up form.
      { source: '/contact', destination: '/sign-up', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/about-us.html', destination: '/about-us', permanent: true },
      { source: '/contact.html', destination: '/sign-up', permanent: true },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
