export type AuthType = "oauth2" | "token" | "none";

export interface AuthTypes {
  nango?: {
    integrationId: string;
  };
}

export interface ClientIntegration {
  name: string;
  authTypes?: AuthTypes;
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
