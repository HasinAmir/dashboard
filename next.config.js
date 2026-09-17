const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: path.resolve(__dirname),
    reactStrictMode: false,
    serverExternalPackages: ['ws'],
};

module.exports = nextConfig;
