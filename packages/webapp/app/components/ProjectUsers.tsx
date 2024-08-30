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

  const rows = data?.data;

  if (!rows || isLoadingUsers) {
    return <SadPath isLoading={isLoadingUsers} />;
  }

  return (
    <div className="">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Initiated At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.provider}</TableCell>
                <TableCell>{row.initiatedAt}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={NUMBER_OF_COLS} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
