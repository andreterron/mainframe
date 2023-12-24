import {
  Integration,
  IntegrationTable,
} from "../../../app/lib/integration-types";

const API_DOMAIN = `https://api.ouraring.com`;

function lastWeekDateParams() {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 14);
  return new URLSearchParams({
    start_date: oneWeekAgo.toISOString().substring(0, 10),
    end_date: now.toISOString().substring(0, 10),
  });
}
function lastWeekDatetimeParams() {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 14);
  return new URLSearchParams({
    start_datetime: oneWeekAgo.toISOString(),
    end_datetime: now.toISOString(),
  });
}

function dateTable(name: string, path: string): IntegrationTable {
  return {
    // https://cloud.ouraring.com/v2/usercollection/rest_mode_period
    name,
    async get(dataset) {
      const q = lastWeekDateParams().toString();

      const res = await fetch(`${API_DOMAIN}/v2/usercollection/${path}?${q}`, {
        headers: {
          Authorization: `Bearer ${dataset.credentials!.token!}`,
        },
      });
      if (!res.ok) {
        console.error(await res.text());
        return [];
      }
      const json = await res.json();
      // TODO: Pagination: json.next_token
      return json.data;
    },
    rowId(dataset, row) {
      return row.id;
    },
  };
}

export const oura: Integration = {
  name: "Oura",
  authType: "token",
  authSetupDocs:
    "https://github.com/andreterron/mainframe/blob/main/packages/docs/integrations/oura.md",
  objects: {
    user: {
      name: "User",
      async get(dataset) {
        const info = await fetch(
          `${API_DOMAIN}/v2/usercollection/personal_info`,
          {
            headers: {
              Authorization: `Bearer ${dataset.credentials!.token!}`,
            },
          },
        );
        return await info.json();
      },
      objId(dataset, obj) {
        return obj.id;
      },
    },
  },
  tables: {
    daily_readiness: dateTable("Readiness", "daily_readiness"),
    daily_activity: dateTable("Daily Activity", "daily_activity"),
    daily_sleep: dateTable("Daily Sleep", "daily_sleep"),
    spo2: dateTable("Blood Oxygenation", "daily_spo2"),
    heartrate: {
      name: "Heart Rate",
      async get(dataset) {
        const q = lastWeekDatetimeParams().toString();

        const res = await fetch(
          `${API_DOMAIN}/v2/usercollection/heartrate?${q}`,
          {
            headers: {
              Authorization: `Bearer ${dataset.credentials!.token!}`,
            },
          },
        );
        if (!res.ok) {
          console.error(await res.text());
          return [];
        }
        const json = await res.json();

        // TODO: Pagination: json.next_token
        return json.data;
      },
      rowId(dataset, row) {
        return row.timestamp;
      },
    },
    restModePeriod: dateTable("Rest Mode", "rest_mode_period"),
    session: dateTable("Session", "session"),
    sleep: dateTable("Sleep", "sleep"),
    sleep_time: dateTable("Sleep Time", "sleep_time"),
    workout: dateTable("Workouts", "workout"),
    tags: dateTable("Tags", "tag"),
    // TODO: Webhooks. Supported types:
    // "tag" "tagV2" "workout" "session" "sleep" "daily_sleep" "daily_readiness" "daily_activity" "daily_spo2" "sleep_time" "rest_mode_period" "ring_configuration" "daily_stress" "daily_cycle_phases"
  },
};
