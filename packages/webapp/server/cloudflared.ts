import { bin, install, tunnel } from "cloudflared";
import { stat } from "node:fs/promises";
import { env } from "../server/lib/env.server";

async function ensureCloudflaredInstalled() {
  // TODO: Auto-update
  try {
    await stat(bin);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      // install cloudflared binary
      await install(bin);
    }
  }
}

export async function startCloudflared() {
  const token = env.CLOUDFLARED_TOKEN;
  if (!token) {
    // Skipping Cloudflare Tunnel setup: No token
    return;
  }

  await ensureCloudflaredInstalled();

  const { child, connections, url } = tunnel({
    "--no-autoupdate": null,
    run: null,
    [`--token=${token}`]: null,
  });

  return { child, url, connections };
}
