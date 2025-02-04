export type AuthType = "oauth2" | "token" | "none";

export interface AuthTypes {
  nango?: {
    integrationId: string;
  };
  form?: {
    params: {
      key: string;
      label?: string;
      placeholder?: string;
      type?: "text" | "password";
    }[];
    info?: string;
  };
}

export interface ComputedDataParam {
  key: string;
  label?: string;
  placeholder?: string;
}

export type ComputedDataParamsDef = ComputedDataParam[];

export interface ClientIntegration {
  name: string;
  underReview: boolean;
  authTypes?: AuthTypes;
  authType?: AuthType;
  authSetupDocs?: string;
  objects: {
    id: string;
    name: string;
  }[];
  tables: {
    id: string;
    name: string;
  }[];
  computed: {
    id: string;
    name: string;
    params: ComputedDataParamsDef;
  }[];
  hasOpenAPI: boolean;
}
