import {
  ClientIntegration,
  Integration,
  IntegrationObject,
  IntegrationTable,
} from "../../app/lib/integration-types";
import { github } from "./integrations/github";
import { network } from "./integrations/network";
import { peloton } from "./integrations/peloton";
import { posthog } from "./integrations/posthog";
import { toggl } from "./integrations/toggl";
import { Dataset } from "@mainframe-so/shared";
import { google } from "./integrations/google";
import { zotero } from "./integrations/zotero";
import { notion } from "./integrations/notion";
import { oura } from "./integrations/oura";

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
  return null;
}

export function createClientIntegration(
  integration: Integration,
): ClientIntegration {
  return {
    name: integration.name,
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
