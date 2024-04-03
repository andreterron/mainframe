import { bool, envsafe, str, url } from "envsafe";

export const env = envsafe(
  {
    VITE_API_URL: url({ default: "http://localhost:8745" }),
    VITE_TRPC_URL: url({ default: "http://localhost:8745/trpc" }),
    VITE_AUTH_PASS: bool({ default: true }),
    VITE_NANGO_PUBLIC_KEY: str({ default: "", allowEmpty: true }),
    VITE_POSTHOG_KEY: str({ default: "", allowEmpty: true }),
    VITE_SENTRY_DNS: str({ default: "", allowEmpty: true }),
  },
  {
    env: import.meta.env,
  },
);
