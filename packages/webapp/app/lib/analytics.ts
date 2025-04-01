import { env } from "./env_client";
import posthogJS from "posthog-js";
import * as Sentry from "@sentry/react";
import { StatsigClient } from "@statsig/react-bindings";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";

export const posthog = env.VITE_POSTHOG_KEY
  ? posthogJS.init(env.VITE_POSTHOG_KEY, {
      api_host: "https://app.posthog.com",
    }) ?? undefined
  : undefined;

export const statsig = env.VITE_STATSIG_CLIENT_KEY
  ? new StatsigClient(
      env.VITE_STATSIG_CLIENT_KEY,
      {},
      {
        plugins: [
          new StatsigAutoCapturePlugin(),
          new StatsigSessionReplayPlugin(),
        ],
      },
    )
  : new StatsigClient(
      "",
      {},
      {
        disableLogging: true,
        disableStorage: true,
        networkConfig: {
          preventAllNetworkTraffic: true,
        },
      },
    ); // Use an invalid client when the client key is not present

async function initSentry() {
  if (!env.VITE_SENTRY_DNS) return undefined;

  Sentry.init({
    dsn: env.VITE_SENTRY_DNS,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/app\.mainframe\.so/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

initSentry();

export { Sentry };
