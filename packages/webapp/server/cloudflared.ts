import { spawn } from "node:child_process";
import { env } from "../app/lib/env.server";

export function startCloudflared() {
    // TODO: Download the correct cloudflared binary. Look at the npm package.
    //       Auto-update if needed.
    const token = env.CLOUDFLARED_TOKEN;
    // TODO: Get the correct path to the cloudflared executable
    const bin = `cloudflared`;
    if (!token) {
        console.log("Missing Cloudflare Tunnel token");
        return undefined;
    }
    const process = spawn(bin, [
        "tunnel",
        "--no-autoupdate",
        "run",
        `--token="${token}"`,
    ]);

    return process;
}
