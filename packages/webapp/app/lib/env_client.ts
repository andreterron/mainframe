import { bool, envsafe, str } from "envsafe";

export const env = envsafe(
  {
    VITE_TRPC_URL: str({ default: "", allowEmpty: true }),
    VITE_AUTH_PASS: bool({ default: true }),
  },
  {
    env: import.meta.env,
  },
);
