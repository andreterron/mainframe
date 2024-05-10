import { Dataset, ClientIntegration } from "@mainframe-so/shared";
import { DatasetHeader } from "./DatasetHeader";
import { Button } from "./ui/button";
import Nango from "@nangohq/frontend";
import { env } from "../lib/env_client";
import { trpc } from "../lib/trpc_client";
import { AlertTriangleIcon } from "lucide-react";
import { UnderReviewMessage } from "./UnderReviewMessage";

export default function DatasetTokenInput({
  onSubmit,
  dataset,
  integration,
}: {
  onSubmit: (creds: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
  }) => void;
  dataset: Dataset;
  integration: ClientIntegration;
}) {
  const utils = trpc.useContext();
  const checkNangoIntegration = trpc.checkNangoIntegration.useMutation({
    onSettled() {
      utils.datasetsGet.invalidate();
    },
  });

  const handleNangoConnection = async (integrationId: string) => {
    if (!env.VITE_NANGO_PUBLIC_KEY) {
      return;
    }
    const nango = new Nango({
      publicKey: env.VITE_NANGO_PUBLIC_KEY,
    });
    try {
      await nango.auth(integrationId, dataset.id);

      // Inform the backend that this is connected
      await checkNangoIntegration.mutateAsync({ datasetId: dataset.id });
    } catch (e) {
      console.error(e);
    }
  };
  const nangoIntegration = integration.authTypes?.nango;
  const hasManualIntegration = integration.authType;
  return (
    <div className="flex flex-col gap-8 items-start">
      <DatasetHeader dataset={dataset}>{dataset.name}</DatasetHeader>
      <div className="flex flex-col gap-8 items-start px-4">
        {nangoIntegration && env.VITE_NANGO_PUBLIC_KEY ? (
          <>
            {integration.underReview && (
              <div className="flex items-start px-3 py-2 border border-amber-700 text-amber-700 bg-amber-100 rounded gap-2 max-w-lg">
                <AlertTriangleIcon className="grow-0 shrink-0 w-4 h-4 mt-1" />
                <div className="flex-1">
                  <UnderReviewMessage integration={integration} />
                </div>
              </div>
            )}
            <Button
              onClick={() =>
                handleNangoConnection(nangoIntegration.integrationId)
              }
            >
              Connect to {integration.name}
            </Button>
            {hasManualIntegration && (
              <>
                <div className="flex w-80 items-center text-gray-400 gap-2">
                  <hr className="h-px flex-1 bg-gray-400" />
                  <span className="text-xs">or</span>
                  <hr className="h-px flex-1 bg-gray-400" />
                </div>
                {/* TODO: Add an indicator that this is an advanced flow */}
                <h2 className="text-lg font-bold ">Use your keys</h2>
              </>
            )}
          </>
        ) : null}
        {integration.authSetupDocs && (
          <Button asChild variant="outline" size="sm">
            <a
              href={integration.authSetupDocs}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700"
            >
              Documentation →
            </a>
          </Button>
        )}
        {hasManualIntegration && (
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              const token = ((e.target as any)?.token as HTMLInputElement)
                ?.value;
              const clientId = (
                (e.target as any)?.client_id as HTMLInputElement
              )?.value;
              const clientSecret = (
                (e.target as any)?.client_secret as HTMLInputElement
              )?.value;
              // TODO: Consider using zod
              if (token || (clientId && clientSecret)) {
                onSubmit({
                  token,
                  clientId,
                  clientSecret,
                });
              } else {
                console.error("Invalid data");
                // TODO: Handle Error
              }
            }}
          >
            <div className="flex flex-col gap-2 items-start">
              {integration.authType === "token" ? (
                <>
                  <label>Token:</label>
                  <input
                    name="token"
                    type="password"
                    className="px-2 py-1 border rounded-md w-96 max-w-full"
                    // Hack to get browsers to not save this "password" field
                    autoComplete="off"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    onBlur={(e) => e.target.setAttribute("readonly", "")}
                  />
                  <button className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 px-2 py-1 rounded-md">
                    Save
                  </button>
                </>
              ) : integration.authType === "oauth2" ? (
                !dataset.credentials?.clientId ||
                !dataset.credentials.clientSecret ? (
                  <>
                    <label>Client ID:</label>
                    <input
                      name="client_id"
                      type="password"
                      className="px-2 py-1 border rounded-md w-96 max-w-full"
                      // Hack to get browsers to not save this "password" field
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
                      onBlur={(e) => e.target.setAttribute("readonly", "")}
                    />
                    <label>Client Secret:</label>
                    <input
                      name="client_secret"
                      type="password"
                      className="px-2 py-1 border rounded-md w-96 max-w-full"
                      // Hack to get browsers to not save this "password" field
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
                      onBlur={(e) => e.target.setAttribute("readonly", "")}
                    />
                    <p>
                      Callback URL:{" "}
                      <code className="p-1 rounded bg-gray-200">
                        {`${location.origin}/oauth/callback/${dataset.id}`}
                      </code>
                    </p>
                    <button className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 px-2 py-1 rounded-md">
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      Callback URL:{" "}
                      <code className="p-1 rounded bg-gray-200">
                        {`${location.origin}/oauth/callback/${dataset.id}`}
                      </code>
                    </p>
                    <a
                      href={`/oauth/start/${dataset.id}`}
                      className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 px-2 py-1 rounded-md"
                    >
                      Authorize
                    </a>
                  </>
                )
              ) : (
                <div>Error: Unsupported auth type</div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
