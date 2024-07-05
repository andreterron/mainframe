import { bool, envsafe, num, str, url } from "envsafe";
import dotenv from "dotenv";
import { env as processEnv } from "node:process";

if (typeof window === "undefined") {
  dotenv.config({ path: processEnv.DOTENV_CONFIG_PATH || "../../.env" });
}

export const env = envsafe({
  PORT: num({ default: 8745 }),
  CLOUDFLARED_TOKEN: str({ default: "", allowEmpty: true }),
  TUNNEL_BASE_API_URL: str({ default: "", allowEmpty: true }),
  APP_URL: url({ default: "http://localhost:8744" }),

  VITE_API_URL: url({
    default: "https://api.mainframe.so",
    devDefault: "http://localhost:8745",
  }),
});
