import createdMDX from "@next/mdx";

/**
 * Clerk live keys only work on gordonstonartfair.com.
 * Local `next dev` / preview use the development instance (*_TEST).
 * Vercel production must keep pk_live_ / sk_live_.
 */
function resolveClerkKeys() {
    const isNextDev = process.argv.includes('dev');
    const onVercelCloud = process.env.VERCEL === '1' && Boolean(process.env.VERCEL_URL);
    const useLiveClerk = !isNextDev
        && onVercelCloud
        && process.env.VERCEL_ENV === 'production';

    let publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
    let secret = process.env.CLERK_SECRET_KEY || '';
    const testPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST || '';
    const testSecret = process.env.CLERK_SECRET_KEY_TEST || '';
    const livePublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_LIVE || '';
    const liveSecret = process.env.CLERK_SECRET_KEY_LIVE || '';

    if (useLiveClerk) {
        if (livePublishable) publishable = livePublishable;
        if (liveSecret) secret = liveSecret;
        if (publishable.startsWith('pk_test_') || secret.startsWith('sk_test_')) {
            throw new Error('Clerk development keys cannot be used in production');
        }
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishable;
        process.env.CLERK_SECRET_KEY = secret;
        return {publishable, secret};
    }

    if (testPublishable) publishable = testPublishable;
    if (testSecret) secret = testSecret;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishable;
    process.env.CLERK_SECRET_KEY = secret;
    return {publishable, secret};
}

const clerkKeys = resolveClerkKeys();
if (process.env.NODE_ENV !== 'production' || process.argv.includes('dev')) {
    const kind = clerkKeys.publishable.startsWith('pk_test_')
        ? 'test'
        : clerkKeys.publishable.startsWith('pk_live_')
            ? 'live'
            : 'unknown';
    console.info(`[clerk] using ${kind} publishable key (${process.argv.includes('dev') ? 'next dev' : process.env.VERCEL_ENV || 'local'})`);
}

/** @type {import('next').NextConfig} */
const withMDX = createdMDX({
    extension: /\.mdx?$/
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKeys.publishable,
    },
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
