import { Integration } from "../integration-types.ts";
import trueCoachOpenApi from "./openapi/truecoach.json?raw";
import { DatasetCredentials } from "@mainframe-api/shared";
import { z } from "zod";
import fetch from "node-fetch";
import { Agent } from "https";

// TODO: Find a way to complete requests without using "rejectUnauthorized"
const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

const zTrueCoachAuthResponseBody = z.object({
  access_token: z.string().min(1),
  // token_type: z.string().min(1),
  // user_id: z.number(),
});

export const truecoach: Integration = {
  name: "TrueCoach",
  authType: "token",
  authTypes: {
    form: {
      params: [
        {
          key: "username",
          label: "Username or email",
          placeholder: "Your TrueCoach username or email",
        },
        {
          key: "password",
          type: "password",
          label: "Password",
          placeholder: "Your TrueCoach password",
        },
      ],
      info: "We don't store your password.",
      async onSubmit(
        params: Record<string, string>,
      ): Promise<DatasetCredentials> {
        const res = await fetch(
          "https://app.truecoach.co/proxy/api/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              grant_type: "password",
              ...params,
            }),
            agent: httpsAgent,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to login to TrueCoach");
        }

        // TODO: this throws!
        const body = zTrueCoachAuthResponseBody.parse(await res.json());

        return { token: body.access_token };
      },
    },
  },
  tables: {},
  openapiSpecs: [trueCoachOpenApi],
  async proxyFetch(token, path, init) {
    const headers = new Headers(init?.headers);
    if (!token) return new Response("Unauthorized", { status: 401 });

    headers.set("Authorization", `Bearer ${token}`);

    // Ensures the path starts with `/proxy/api/`
    const urlPath = path.match(/^\/?proxy\/api(\/|$)/)
      ? path.replace(/^\//, "")
      : `proxy/api/${path.replace(/^\//, "")}`;

    // Creates the request, then overrides the headers
    const req = new Request(
      new Request(`https://app.truecoach.co/${urlPath}`, init),
      { headers },
    );

    // Unfortunately fetch(req) doesn't work with node-fetch

    // TODO: Check if the response needs to be cleaned
    return fetch(req.url, {
      method: req.method,
      // body: req.body, // TODO: Support body
      headers: Object.fromEntries(headers.entries()),
      agent: httpsAgent,
    }) as any as Promise<Response>;
  },
};
