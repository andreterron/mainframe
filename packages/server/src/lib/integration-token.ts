import { Dataset } from "@mainframe-api/shared";
import { nango } from "./nango.ts";
import { AuthModes } from "@nangohq/node";

export async function getTokenFromDataset(
  dataset: Pick<Dataset, "id" | "credentials">,
) {
  if (dataset.credentials?.nangoIntegrationId) {
    const connection = await nango?.getConnection(
      dataset.credentials?.nangoIntegrationId,
      dataset.id,
      false,
    );
    if (connection?.credentials.type === AuthModes.OAuth2) {
      return connection.credentials.access_token;
    }
  }
  // TODO: Support non-Nango OAuth
  return dataset.credentials?.token;
}
