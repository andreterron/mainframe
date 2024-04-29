import { Dataset } from "@mainframe-so/shared";
import { nango } from "./nango";
import { AuthModes } from "@nangohq/node";

export async function getTokenFromDataset(dataset: Dataset) {
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
  return dataset.credentials?.token;
}
