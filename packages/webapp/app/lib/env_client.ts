import { bool, envsafe, url } from "envsafe";

export const env = envsafe(
  {
    VITE_API_URL: url({ default: "http://localhost:8745" }),
    VITE_TRPC_URL: url({ default: "http://localhost:8745/trpc" }),
    VITE_AUTH_PASS: bool({ default: true }),
  },
  {
    env: import.meta.env,
  },
);
