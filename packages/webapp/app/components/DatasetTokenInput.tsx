import { Dataset, ClientIntegration } from "@mainframe-so/shared";
import { DatasetHeader } from "./DatasetHeader";

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
  return (
    <div className="flex flex-col gap-8 items-start">
      <DatasetHeader dataset={dataset}>{dataset.name}</DatasetHeader>
      {integration.authSetupDocs && (
        <a
          href={integration.authSetupDocs}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 py-1 px-2 rounded border"
        >
          Documentation →
        </a>
      )}
      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const token = ((e.target as any)?.token as HTMLInputElement)?.value;
          const clientId = ((e.target as any)?.client_id as HTMLInputElement)
            ?.value;
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
    </div>
  );
}
