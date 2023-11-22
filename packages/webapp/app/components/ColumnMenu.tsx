import { Header } from "@tanstack/react-table";
import { EyeOffIcon, MoreVerticalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ColumnMenu({
  header,
}: {
  header: Header<Record<string, any>, unknown>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-2 opacity-0 data-[state=open]:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 inline-flex justify-center rounded-md text-gray-400 bg-black bg-opacity-0 p-1.5 text-sm font-medium hover:bg-opacity-5 data-[state=open]:bg-opacity-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-75">
        <MoreVerticalIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => {
            header.column.toggleVisibility();
          }}
        >
          <EyeOffIcon className="mr-2 h-4 w-4" />
          <span>Hide column</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
