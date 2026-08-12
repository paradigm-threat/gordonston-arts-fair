import generated from "@next/mdx";

/** @type {import('next').NextConfig} */
// next.config.js
const withMDX = generated({
    extension: /\.mdx?$/
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configure `pageExtensions` to include MDX files
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    
    // Optionally, add any other Next.js config below
    serverExternalPackages: ['sequelize'],

    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    },
    images: {
        remotePatterns: [
            new URL('https://*.public.blob.vercel-storage.com/**')
            ]
    },

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {key: 'X-Frame-Options', value: 'DENY'},
                    {key: 'X-Content-Type-Options', value: 'nosniff'},
                    {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
                    {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
                    {key: 'X-DNS-Prefetch-Control', value: 'on'},
                ],
            },
        ];
    },

    async redirects() {
        return [
            {source: '/index', destination: '/', permanent: true},
            {source: '/index/', destination: '/', permanent: true},
        ];
    },

    allowedDevOrigins: ['127.0.0.1'],
}

export default withMDX(nextConfig)
