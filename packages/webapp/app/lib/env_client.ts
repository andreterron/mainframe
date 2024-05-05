import { bool, envsafe, str, url } from "envsafe";

export const env = envsafe(
  {
    VITE_APP_URL: url({
      default: "https://app.mainframe.so",
      devDefault: "http://localhost:8744",
    }),
    VITE_API_URL: url({
      default: "https://api.mainframe.so",
      devDefault: "http://localhost:8745",
    }),
    VITE_AUTH_PASS: bool({ default: true }),
    VITE_NANGO_PUBLIC_KEY: str({ default: "", allowEmpty: true }),
    VITE_POSTHOG_KEY: str({ default: "", allowEmpty: true }),
    VITE_SENTRY_DNS: str({ default: "", allowEmpty: true }),
  },
  {
    env: import.meta.env,
  },
);
