import { env } from "./env.server";
import { Integration } from "./integration-types";
import { bitbucket } from "./integrations/bitbucket";
import { github } from "./integrations/github";
import { google } from "./integrations/google";
import { notion } from "./integrations/notion";
import { oura } from "./integrations/oura";
import { peloton } from "./integrations/peloton";
import { truecoach } from "./integrations/truecoach";
import { posthog } from "./integrations/posthog";
import { render } from "./integrations/render";
import { spotify } from "./integrations/spotify";
import { toggl } from "./integrations/toggl";
import { valtown } from "./integrations/valtown";
import { vercel } from "./integrations/vercel";
import { zotero } from "./integrations/zotero";

export const integrationsMap: Record<string, Integration> = {
  google: google,
  toggl: toggl,
  posthog: posthog,
  github: github,
  render: render,
  vercel: vercel,
  peloton: peloton,
  truecoach: truecoach,
  // network: network,
  zotero: zotero,
  notion: notion,
  oura: oura,
  bitbucket: bitbucket,
  valtown: valtown,
  ...(env.NANGO_PRIVATE_KEY ? { spotify: spotify } : {}),
};
