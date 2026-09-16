import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to dev-mode assets by default
  // (only `localhost` is allowed). Opening the admin panel from a LAN IP —
  // e.g. from another device — otherwise gets its JS chunks silently 403'd,
  // which breaks hydration: the login form's submit handler never attaches,
  // so the browser falls back to a native GET submit with the password in
  // the URL. Add this machine's LAN IP so dev-mode access from other
  // devices works.
  allowedDevOrigins: ["192.168.1.40"],
  // The App Versions page uploads home-screen images (≤ 10 MB) through a
  // Server Action; the default 1 MB body limit would reject them before
  // they ever reached the backend, which enforces the real limits.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
