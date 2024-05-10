import { ClientIntegration } from "@mainframe-so/shared";

export function UnderReviewMessage({
  integration,
}: {
  integration: ClientIntegration;
}) {
  return (
    <>
      This integration is currently awaiting approval from {integration.name}.
      Please send us a{" "}
      <a className="underline" href="https://discord.gg/HUS4y59Dxw">
        Discord
      </a>{" "}
      message if you need help.
    </>
  );
}
