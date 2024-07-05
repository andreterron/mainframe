import { bool, envsafe, num, str, url } from "envsafe";
import dotenv from "dotenv";
import { env as processEnv } from "node:process";

if (typeof window === "undefined") {
  dotenv.config({ path: processEnv.DOTENV_CONFIG_PATH || "../../.env" });
}

export const env = envsafe({
  COOKIE_SECRET: str({ default: "", allowEmpty: true }),
  AUTH_LOGIN_URL: str({ default: "", allowEmpty: true }),
  AUTH_LOGOUT_URL: str({ default: "", allowEmpty: true }),
  APP_URL: url({ default: "http://localhost:8744" }),
  NANGO_PRIVATE_KEY: str({ default: "", allowEmpty: true }),
  OPENAI_API_KEY: str({ default: "", allowEmpty: true }),

  VITE_AUTH_PASS: bool({ default: true }),
  VITE_API_URL: url({
    default: "https://api.mainframe.so",
    devDefault: "http://localhost:8745",
  }),
});
