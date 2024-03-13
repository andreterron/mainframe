export type AuthType = "oauth2" | "token" | "none";

export interface ClientIntegration {
  name: string;
  authType: AuthType;
  authSetupDocs?: string;
  objects: {
    id: string;
    name: string;
  }[];
  tables: {
    id: string;
    name: string;
  }[];
}
