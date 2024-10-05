import { useParams } from "react-router-dom";
import { AppWindow, ArrowUpRightIcon, ShieldCheck, Zap } from "lucide-react";
import { trpc } from "../../lib/trpc_client";
import { Button } from "../ui/button";
import { env } from "../../lib/env_client";
import Nango from "@nangohq/frontend";
import { datasetIcon } from "../../lib/integrations/icons/datasetIcon";
import mainframeLogo from "../../images/mainframe-dark.svg";
import { apiClient } from "../../lib/api_client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";
import { z } from "zod";

export function ConnectPage() {
  const params = useParams();
  const linkId = params.linkId;
  // const utils = trpc.useUtils();
  // const checkNangoIntegration = trpc.checkNangoIntegration.useMutation({
  //   onSettled() {
  //     utils.datasetsGet.invalidate();
  //   },
  // });
  const { data: connection, isLoading: isLoadingConnection } = useQuery(
    ["connect_link", linkId],
    async () => {
      if (!linkId) {
        throw new Error("Invalid link ID");
      }
      const res = await apiClient.connect.link[":link_id"].$get({
        param: {
          link_id: linkId,
        },
      });
      return res.json();
    },
  );
  const { data: integrations, isLoading: isLoadingIntegrations } =
    trpc.integrationsAll.useQuery();
  const integration = connection?.provider
    ? integrations?.[connection?.provider]
    : undefined;

  const handleNangoConnection = async (integrationId: string) => {
    if (!env.VITE_NANGO_PUBLIC_KEY || !connection?.id || !linkId) {
      return;
    }
    const nango = new Nango({
      publicKey: env.VITE_NANGO_PUBLIC_KEY,
    });
    try {
      // TODO: Create new dataset? Create unauth user?
      // TODO: Mainframe is in a new tab, and nango.auth opens yet another tab.
      //       can we limit to just one new tab?
      const nangoResult = await nango.auth(integrationId, connection.id);

      const connRes = await apiClient.connect.link[":link_id"].$put({
        param: {
          link_id: linkId,
        },
        json: {
          nangoConnectionId: nangoResult.connectionId,
        },
      });

      if (!connRes.ok) {
        console.error(await connRes.text());
        return;
      }
      // Inform the backend that this is connected
      // await checkNangoIntegration.mutateAsync({ datasetId: dataset.id });
      window.close();
    } catch (e) {
      console.error(e);
    }
  };
  const handleTokenConnection = async (apiKey: string) => {
    if (!connection?.id || !linkId) {
      return;
    }

    try {
      const connRes = await apiClient.connect.link[":link_id"].$put({
        param: {
          link_id: linkId,
        },
        json: {
          apiKey,
        },
      });

      if (!connRes.ok) {
        console.error(await connRes.text());
        return;
      }
      // Inform the backend that this is connected
      // await checkNangoIntegration.mutateAsync({ datasetId: dataset.id });
      window.close();
    } catch (e) {
      console.error(e);
    }
  };
  const nangoIntegration = integration?.authTypes?.nango;

  if (!integration || !connection?.provider) {
    if (isLoadingIntegrations || isLoadingConnection) {
      return <div></div>;
    }
    return <div>Integration not found</div>;
  }
  const icon = datasetIcon(connection.provider);

  return (
    <div className="flex flex-col justify-center min-h-screen bg-zinc-100 p-6">
      <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-xl">
        <div className="flex items-center justify-center mb-10 relative animate-unfold-connect">
          <div className="bg-white border-zinc-800 border w-12 h-12 rounded-lg text-zinc-900 flex items-center justify-center shadow-0-2">
            <AppWindow className="w-7 h-7" />
          </div>
          <PulseBeam />
          <div className="bg-zinc-800 border-amber-400 border w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden animate-scale-in">
            <img
              className="w-12 h-12 object-contain"
              src={mainframeLogo}
              alt="Mainframe Logo"
            />
          </div>
          <PulseBeam />
          <div className="bg-white border-zinc-800 border w-12 h-12 rounded-lg flex items-center justify-center shadow-0-2">
            <img
              className="w-8 h-8 object-contain"
              src={icon}
              alt="GitHub Logo"
            />
          </div>
        </div>

        <div className="text-center text-lg mb-12">
          <p className="mb-4 text-zinc-700 dark:text-zinc-300">
            This application partners with{" "}
            <strong className="text-zinc-950">Mainframe</strong> to securely
            connect to {integration.name}.
          </p>
          <div className="flex mt-5 mb-4">
            <Zap className="w-4 h-4 text-zinc-500 inline-block mr-3 mt-[2px] flex-none" />
            <p className="text-sm text-zinc-500 text-left">
              Mainframe lets you effortlessly connect to your accounts in
              seconds.
            </p>
          </div>
          <div className="flex mb-4">
            <ShieldCheck className="w-4 h-4 text-zinc-500 inline-block mr-3 mt-[2px] flex-none" />
            <p className="text-sm text-zinc-500 text-left">
              Mainframe ensures your data remains protected and is never used
              without your permission. Learn more at{" "}
              <a
                href="https://mainframe.so"
                className="text-zinc-950 font-medium hover:underline"
              >
                mainframe.so
              </a>
              .
            </p>
          </div>
        </div>

        {nangoIntegration && env.VITE_NANGO_PUBLIC_KEY ? (
          <Button
            className="bg-zinc-900 hover:bg-zinc-800 text-amber-50 font-semibold py-3 px-8 transition duration-300 ease-in-out"
            onClick={() =>
              handleNangoConnection(nangoIntegration.integrationId)
            }
          >
            Continue
          </Button>
        ) : (
          <form
            className="text-start"
            onSubmit={(e) => {
              e.preventDefault();
              const apiKey = z
                .string()
                .parse(
                  new FormData(e.target as HTMLFormElement).get("key_input"),
                );
              handleTokenConnection(apiKey);
            }}
          >
            <Label
              htmlFor="key_input"
              className="ml-3 border-l border-l-transparent"
            >
              API key
            </Label>
            <Input
              id="key_input"
              type="password"
              name="key_input"
              placeholder="Paste your API key here"
            />
            <div
              className={cn(
                "flex w-full items-center mt-2",
                integration.authSetupDocs ? "justify-between" : "justify-end",
              )}
            >
              {integration.authSetupDocs ? (
                <Button asChild variant="ghost" size="sm">
                  <a
                    href={integration?.authSetupDocs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-sky-500"
                  >
                    Documentation <ArrowUpRightIcon className="size-4" />
                  </a>
                </Button>
              ) : null}
              <Button size="sm">Continue</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PulseBeam() {
  return (
    <div className="flex-grow h-[1px] bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 mx-3 rounded-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-amber-400 via-zinc-700 to-amber-400 animate-pulse-beam translate-x-[-100%]"></div>
    </div>
  );
}
