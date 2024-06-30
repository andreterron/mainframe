export async function initiateAuth(provider: "github") {
  const w = window.open(`https://mainframe.so/connect/${provider}`, "_blank");
  // w?.addEventListener("message", (event) => {
  //   // TODO: Try to use window events to get the id of the connection so we can await the auth flow.
  //   // TODO: Only accept messages from the expected event.origin
  // });
}
