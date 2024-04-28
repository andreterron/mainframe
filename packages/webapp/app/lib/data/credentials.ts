import { Dataset, DatasetCredentials } from "@mainframe-so/shared";

type VisibleCredentialKey = Exclude<
  keyof DatasetCredentials,
  "nangoIntegrationId"
>;

export function getDatasetCredentialsKeys(
  credentials: DatasetCredentials | undefined | null,
): VisibleCredentialKey[] {
  return Object.keys(credentials ?? {}).filter(
    (k) => k !== "nangoIntegrationId",
  ) as VisibleCredentialKey[];
}
