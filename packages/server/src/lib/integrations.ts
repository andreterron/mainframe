import {
  Integration,
  IntegrationComputed,
  IntegrationObject,
  IntegrationTable,
} from "./integration-types.ts";
import { Dataset, ClientIntegration } from "@mainframe-api/shared";
import { github } from "./integrations/github.ts";
import { peloton } from "./integrations/peloton.ts";
import { posthog } from "./integrations/posthog.ts";
import { toggl } from "./integrations/toggl.ts";
import { google } from "./integrations/google.ts";
import { zotero } from "./integrations/zotero.ts";
import { notion } from "./integrations/notion.ts";
import { oura } from "./integrations/oura.ts";
import { bitbucket } from "./integrations/bitbucket.ts";
import { spotify } from "./integrations/spotify.ts";
import { render } from "./integrations/render.ts";
import { vercel } from "./integrations/vercel.ts";
import { valtown } from "./integrations/valtown.ts";
import { pick } from "lodash-es";
import { z } from "zod";

export const supportedConnectProviders = [
  "github",
  "bitbucket",
  "google",
  "toggl",
] as const;

export const zTokenCredentials = z.object({ token: z.string().min(1) });
export const zOAuthCredentials = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export function getIntegrationFromType(
  type: string | undefined,
): Integration | null {
  if (type === "toggl") {
    return toggl;
  }
  if (type === "posthog") {
    return posthog;
  }
  if (type === "github") {
    return github;
  }
  if (type === "peloton") {
    return peloton;
  }
  if (type === "google") {
    return google;
  }
  if (type === "zotero") {
    return zotero;
  }
  if (type === "notion") {
    return notion;
  }
  if (type === "oura") {
    return oura;
  }
  if (type === "spotify") {
    return spotify;
  }
  if (type === "render") {
    return render;
  }
  if (type === "vercel") {
    return vercel;
  }
  if (type === "bitbucket") {
    return bitbucket;
  }
  if (type === "valtown") {
    return valtown;
  }
  return null;
}

export function createClientIntegration(
  integration: Integration,
): ClientIntegration {
  return {
    name: integration.name,
    underReview: integration.underReview ?? false,
    authTypes: !integration.authTypes
      ? integration.authTypes
      : {
          nango: integration.authTypes.nango,
          form: !integration.authTypes.form
            ? integration.authTypes.form
            : pick(integration.authTypes.form, ["info", "params"]),
        },
    authType: integration.authType,
    authSetupDocs: integration.authSetupDocs,
    objects: Object.entries(integration.objects ?? {}).map(([k, v]) => ({
      id: k,
      name: v.name,
    })),
    tables: Object.entries(integration.tables ?? {}).map(([k, v]) => ({
      id: k,
      name: v.name,
    })),
    computed: Object.entries(integration.computed ?? {}).map(([k, v]) => ({
      id: k,
      name: v.name,
      params: v.params,
    })),
    hasOpenAPI: !!integration.openapiSpecs?.length,
  };
}

export function getIntegrationForDataset(dataset: Dataset): Integration | null {
  return getIntegrationFromType(dataset.integrationType ?? undefined);
}

export function getObjectsForDataset(dataset: Dataset) {
  const integration = getIntegrationForDataset(dataset);
  if (!integration || !integration.objects) return [];
  return Object.entries(integration.objects).map(([id, obj]) => ({
    id,
    ...obj,
  }));
}

export function getDatasetObject(
  dataset: Dataset,
  objectId: string,
): (IntegrationObject & { id: string }) | null {
  const integration = getIntegrationForDataset(dataset);
  const object = integration?.objects?.[objectId];
  return object ? { ...object, id: objectId } : null;
}

export function getTablesForDataset(dataset: Dataset) {
  const integration = getIntegrationForDataset(dataset);
  if (!integration) return [];
  return Object.entries(integration.tables).map(([id, table]) => ({
    id,
    ...table,
  }));
}

export function getDatasetTable(
  dataset: Dataset,
  tableId: string,
): (IntegrationTable & { id: string }) | null {
  const integration = getIntegrationForDataset(dataset);
  const table = integration?.tables?.[tableId];
  return table ? { ...table, id: tableId } : null;
}

export function getDatasetFunction(
  dataset: Dataset,
  functionName: string,
): (IntegrationComputed & { id: string }) | null {
  const integration = getIntegrationForDataset(dataset);
  const fn = integration?.computed?.[functionName];
  return fn ? { ...fn, id: functionName } : null;
}
