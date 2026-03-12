/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  transpilePackages: [
    "@tenderwatch/db",
    "@tenderwatch/billing",
    "@tenderwatch/shared",
    "@tenderwatch/jobs",
    "@tenderwatch/agent",
    "@tenderwatch/crypto",
    "@tenderwatch/processor"
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    },
    serverComponentsExternalPackages: [
      "playwright-core",
      "@browserbasehq/sdk",
      "libsodium-wrappers"
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "playwright-core": "commonjs playwright-core",
        "@browserbasehq/sdk": "commonjs @browserbasehq/sdk",
        "libsodium-wrappers": "commonjs libsodium-wrappers",
      });
    }
    return config;
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
