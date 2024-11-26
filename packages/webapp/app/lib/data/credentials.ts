import { Dataset, DatasetCredentials } from "@mainframe-api/shared";

type VisibleCredentialKey = Exclude<
  keyof DatasetCredentials,
  "nangoIntegrationId" | "nangoConnectionId"
>;

export function getDatasetCredentialsKeys(
  credentials: DatasetCredentials | undefined | null,
): VisibleCredentialKey[] {
  return Object.keys(credentials ?? {}).filter(
    (k) => k !== "nangoIntegrationId" && k !== "nangoConnectionId",
  ) as VisibleCredentialKey[];
}
