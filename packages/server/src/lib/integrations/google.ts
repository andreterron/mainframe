import { Integration } from "../integration-types.ts";
import { Dataset } from "@mainframe-api/shared";
import { google as api, calendar_v3 } from "googleapis";
import { datasetsTable } from "@mainframe-api/shared";
import { eq } from "drizzle-orm";
import { type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { getTokenFromDataset } from "../integration-token.ts";

async function getAuth(dataset: Dataset, db: SqliteRemoteDatabase) {
  if (dataset.credentials?.nangoIntegrationId) {
    const token = await getTokenFromDataset(dataset);
    return new api.auth.OAuth2({
      credentials: {
        access_token: token,
      },
    });
  }
  if (
    !dataset.credentials ||
    !dataset.credentials.clientId ||
    !dataset.credentials.clientSecret
  ) {
    // TODO: Error
    return null;
  }

  const oauth2Client = new api.auth.OAuth2({
    clientId: dataset.credentials.clientId,
    clientSecret: dataset.credentials.clientSecret,
    credentials: {
      access_token: dataset.credentials?.accessToken,
      refresh_token: dataset.credentials?.refreshToken,
    },
  });

  // TODO: Only refresh token if it's expired, or close to it
  if (dataset.credentials?.refreshToken) {
    const resp = await oauth2Client.refreshAccessToken();

    await db
      .update(datasetsTable)
      .set({
        credentials: {
          ...dataset.credentials,
          accessToken: resp.credentials.access_token ?? undefined,
          refreshToken: resp.credentials.refresh_token ?? undefined,
        },
      })
      .where(eq(datasetsTable.id, dataset.id));
  }

  return oauth2Client;
}

export const google: Integration = {
  name: "Google Calendar",
  authType: "oauth2",
  // TODO: Show the markdown file in the dashboard
  authSetupDocs: "https://docs.mainframe.so/integrations/google",
  authTypes: {
    nango: { integrationId: "google-calendar" },
  },
  async getOAuthUrl(baseUrl: string, dataset: Dataset) {
    if (
      !dataset.credentials ||
      !dataset.credentials.clientId ||
      !dataset.credentials.clientSecret
    ) {
      // TODO: Error
      return null;
    }

    const oauth2Client = new api.auth.OAuth2({
      clientId: dataset.credentials.clientId,
      clientSecret: dataset.credentials.clientSecret,
      redirectUri: `${baseUrl}/${dataset.id}`,
    });

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Ensure we'll get a refresh token
      scope: "https://www.googleapis.com/auth/calendar.readonly",
    });
  },
  async oauthCallback(baseUrl, dataset, query, db) {
    if (
      !dataset.credentials ||
      !dataset.credentials.clientId ||
      !dataset.credentials.clientSecret
    ) {
      // TODO: Error
      throw new Error("Missing Credentials");
    }

    const oauth2Client = new api.auth.OAuth2({
      clientId: dataset.credentials.clientId,
      clientSecret: dataset.credentials.clientSecret,
      redirectUri: `${baseUrl}/${dataset.id}`,
    });

    const token = await oauth2Client.getToken(query.code);

    await db
      .update(datasetsTable)
      .set({
        credentials: {
          ...dataset.credentials,
          accessToken: token.tokens.access_token ?? undefined,
          refreshToken: token.tokens.refresh_token ?? undefined,
        },
      })
      .where(eq(datasetsTable.id, dataset.id));
  },
  async proxyFetch(token, path, init) {
    const headers = new Headers(init?.headers);
    if (!token) return new Response("Unauthorized", { status: 401 });

    headers.set("Authorization", `Bearer ${token}`);

    return fetch(`https://www.googleapis.com/${path}`, {
      ...init,
      headers,
    });
  },
  tables: {
    events: {
      name: "Events",
      get: async (dataset: Dataset, db) => {
        const oauth2Client = await getAuth(dataset, db);
        if (!oauth2Client) {
          console.error("Failed to get oauth2Client for Google");
          return [];
        }

        const cal = api.calendar({
          version: "v3",
          auth: oauth2Client,
        });

        const calendars = await cal.calendarList.list();

        const events: calendar_v3.Schema$Event[] = [];

        for (let calendar of calendars.data.items ?? []) {
          if (!calendar.id) continue;
          // TODO: Sort?
          const calEvents = await cal.events.list({
            calendarId: calendar.id,
          });
          events.push(...(calEvents.data.items ?? []));
        }

        return events;
      },
      rowId: (dataset: Dataset, row: any) => `${row.id}`,
    },
    calendars: {
      name: "Calendars",
      get: async (dataset: Dataset, db) => {
        const oauth2Client = await getAuth(dataset, db);
        if (!oauth2Client) {
          console.error("Failed to get oauth2Client for Google");
          return [];
        }

        const cal = api.calendar({
          version: "v3",
          auth: oauth2Client,
        });

        const result = await cal.calendarList.list();

        return result.data.items ?? [];
      },
      rowId: (dataset: Dataset, row: any) => `${row.id}`,
    },
  },
};
