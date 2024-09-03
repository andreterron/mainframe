import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api_client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { SadPath } from "./SadPath";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const NUMBER_OF_COLS = 3;

export function ProjectUsers({ appId }: { appId: string }) {
  const { data, isLoading: isLoadingUsers } = useQuery(
    ["project_users", appId],
    async () => {
      if (!appId) {
        console.log("Invelid app ID");
        throw new Error("Invalid app ID");
      }
      const res = await apiClient.connect.apps[":app_id"].users.$get({
        param: {
          app_id: appId,
        },
      });
      return res.json();
    },
  );

  // TODO: Parse row.initiatedAt
  const rows = data?.data;

  if (!rows || isLoadingUsers) {
    return <SadPath isLoading={isLoadingUsers} />;
  }

  return (
    <div>
      <div className="border rounded overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="[&>*]:bg-muted">
              <TableHead>ID</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Connected on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.provider}</TableCell>
                  {/* TODO: Timezones */}
                  <Tooltip delayDuration={500}>
                    <TooltipTrigger asChild>
                      <TableCell>
                        {new Date(row.initiatedAt).toLocaleString()}
                      </TableCell>
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-xs"
                      side="bottom"
                      sideOffset={12}
                    >
                      {row.initiatedAt}
                    </TooltipContent>
                  </Tooltip>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={NUMBER_OF_COLS}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* TODO: Pagination */}
      <p className="text-xs text-muted-foreground p-4 prose max-w-none">
        {data.count} connection total
        {data.count > data.data.length && (
          <>
            . Showing first {data.data.length} rows. Pagination coming soon.{" "}
            <a
              href="https://discord.gg/HUS4y59Dxw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              Request it on our Discord
            </a>
          </>
        )}
      </p>
    </div>
  );
}
