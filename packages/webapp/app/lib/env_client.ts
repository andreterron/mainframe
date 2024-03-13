import { bool, envsafe } from "envsafe";

export const env = envsafe(
  {
    VITE_AUTH_PASS: bool({ default: true }),
  },
  {
    env: import.meta.env,
  },
);
