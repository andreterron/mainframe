import { bool, envsafe, num, str, url } from "envsafe";
import dotenv from "dotenv";
import { env as processEnv } from "node:process";

if (typeof window === "undefined") {
  dotenv.config({ path: processEnv.DOTENV_CONFIG_PATH || "../../.env" });
}

export const env = envsafe({
  APP_URL: url({ default: "http://localhost:8744" }),
  NANGO_PRIVATE_KEY: str({ default: "", allowEmpty: true }),
});
