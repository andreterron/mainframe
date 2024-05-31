import {
  Integration,
  IntegrationComputed,
  IntegrationObject,
  IntegrationTable,
} from "./integration-types.js";
import { github } from "./integrations/github.js";
import { network } from "./integrations/network.js";
import { peloton } from "./integrations/peloton.js";
import { posthog } from "./integrations/posthog.js";
import { toggl } from "./integrations/toggl.js";
import { Dataset, ClientIntegration } from "@mainframe-so/shared";
import { google } from "./integrations/google.js";
import { zotero } from "./integrations/zotero.js";
import { notion } from "./integrations/notion.js";
import { oura } from "./integrations/oura.js";
import { bitbucket } from "./integrations/bitbucket.js";
import { spotify } from "./integrations/spotify.js";
import { render } from "./integrations/render.js";
import { vercel } from "./integrations/vercel.js";
import { valtown } from "./integrations/valtown.js";
import { pick } from "lodash-es";
import { z } from "zod";

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
  if (type === "network") {
    return network;
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
