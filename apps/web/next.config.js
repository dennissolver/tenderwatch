/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  transpilePackages: [
    "@tenderwatch/db",
    "@tenderwatch/billing",
    "@tenderwatch/shared"
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

module.exports = withSentryConfig(nextConfig, {
  org: "corporate-ai-solutions",
  project: "tenderwatch",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});