/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        sandbox_domain: 'https://finch-sandbox-se-interview.vercel.app',
        finch_client_id: '5c143df2-b6a8-4925-a998-53a1dd163129',
        finch_client_secret: 'finch-secret-sandbox-aajCBlbPavIpd7wgtFRP_4gDo1vDgVq8rD1or-v9',
    },
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
