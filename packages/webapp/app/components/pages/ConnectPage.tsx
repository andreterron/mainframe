import { Link, useParams } from "react-router-dom";
import { Dataset, ClientIntegration } from "@mainframe-api/shared";
import { DatasetHeader } from "../DatasetHeader";
import { getDatasetCredentialsKeys } from "../../lib/data/credentials";
import { CheckIcon, FunctionSquareIcon, PencilIcon } from "lucide-react";
import { PreviewLabel } from "../PreviewLabel";
import { trpc } from "../../lib/trpc_client";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { z } from "zod";
import { env } from "../../lib/env_client";
import Nango from "@nangohq/frontend";
import { datasetIcon } from "../../lib/integrations/icons/datasetIcon";
import mainframeLogo from "../../images/icon-192x192.png";
import { nanoid } from "nanoid";
import { apiClient } from "../../lib/api_client";
import { useQuery } from "@tanstack/react-query";

export function ConnectPage() {
  const params = useParams();
  const linkId = params.linkId;
  // const utils = trpc.useUtils();
  // const checkNangoIntegration = trpc.checkNangoIntegration.useMutation({
  //   onSettled() {
  //     utils.datasetsGet.invalidate();
  //   },
  // });
  const { data: connection } = useQuery(["connect_link", linkId], async () => {
    if (!linkId) {
      throw new Error("Invalid link ID");
    }
    const res = await apiClient.connect.link[":link_id"].$get({
      param: {
        link_id: linkId,
      },
    });
    return res.json();
  });
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
  const nangoIntegration = integration?.authTypes?.nango;

  if (!nangoIntegration || !connection?.provider) {
    if (isLoadingIntegrations) {
      return <div></div>;
    }
    return <div>Integration not found</div>;
  }
  const icon = datasetIcon(connection.provider);

  return (
    <div className="flex flex-col pt-32 gap-8 items-center max-w-2xl mx-auto">
      <div className="flex w-full items-center max-w-60">
        <div className="bg-blue-400 border-blue-600 border size-12 rounded-lg text-white flex items-center justify-center">
          App
        </div>
        <div className="flex-grow h-px border-dashed border-t border-black"></div>
        <img
          className="border-amber-300 border size-12 rounded-lg overflow-hidden"
          src={mainframeLogo}
        />
        <div className="flex-grow h-px border-dashed border-t border-black"></div>
        <div className="bg-white border-gray-400 border size-12 p-1.5 rounded-lg">
          <img className="relative object-contain" src={icon} />
        </div>
      </div>
      <div className="text-center font-light text-lg">
        This application uses{" "}
        <strong className="font-semibold">Mainframe</strong>
        <br />
        to connect to {integration.name}.
      </div>
      <div className="flex flex-col gap-8 items-start px-4">
        {nangoIntegration && env.VITE_NANGO_PUBLIC_KEY ? (
          <>
            <Button
              onClick={() =>
                handleNangoConnection(nangoIntegration.integrationId)
              }
            >
              Continue
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
