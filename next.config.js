/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/sandbox/create',
                destination: "https://finch-sandbox-se-interview.vercel.app/api/sandbox/create"
            },
            {
                source:'/api/employer/company',
                destination:'https://finch-sandbox-se-interview.vercel.app/api/employer/company'
            },
            {   
                source: '/api/employer/directory',
                destination: 'https://finch-sandbox-se-interview.vercel.app/api/employer/directory'
            },
            {
                source: '/api/employer/individual',
                destination: 'https://finch-sandbox-se-interview.vercel.app/api/employer/individual'
            }
    ];
    },
}

module.exports = nextConfig
