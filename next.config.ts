import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the invoice-PDF fonts into the serverless functions that render it.
  outputFileTracingIncludes: {
    "/api/invoices/**": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
