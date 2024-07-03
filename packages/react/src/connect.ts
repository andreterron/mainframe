async function getConnectionId(
  provider: "github",
  appId: string,
  config?: { apiUrl?: string },
) {
  const res = await fetch(
    `${
      config?.apiUrl ?? "https://api.mainframe.so"
    }/connect/apps/${appId}/connections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
      }),
      credentials: "include",
    },
  );
  const body = (await res.json()) as { id: string };

  return body.id;
}

export async function initiateAuth(
  provider: "github",
  appId: string,
  config?: { apiUrl?: string; rootUrl?: string },
) {
  const connectionId = await getConnectionId(provider, appId, config);
  // TODO: Need to inform the developer's app ID to Mainframe
  // TODO: Remove appId and provider from URL
  const w = window.open(
    `${
      config?.rootUrl ?? "https://mainframe.so"
    }/connect/${appId}/${connectionId}/${provider}`,
    "_blank",
  );

  await new Promise<void>((resolve) => {
    function recheck() {
      // TODO: Only remove listeners and remove if the check was successful.
      // w?.removeEventListener("message", messageCallback);
      // TODO: Check for window.closed probably isn't a good indicator
      if (w?.closed) {
        window.removeEventListener("focus", recheck);
        resolve();
      }
    }
    // w?.addEventListener("message", (event) => {
    //   // TODO: Try to use window events to get the id of the connection so we can await the auth flow.
    //   // TODO: Only accept messages from the expected event.origin
    // });
    window.addEventListener("focus", recheck);
    // TODO: Timeout. reject
  });
}
