import { env } from "../lib/env_client";
import { createApiClient } from "mainframe-api";

export const apiClient = createApiClient(env.VITE_API_URL);
