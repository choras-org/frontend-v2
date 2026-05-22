import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

interface SourceReceiversMenuProps {
  onRemoveAll: () => void;
}

export function SourceReceiversMenu({ onRemoveAll }: SourceReceiversMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full hover:bg-gray-600 hover:text-white cursor-pointer"
        >
          <EllipsisVertical size={20} className="text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="cursor-pointer" onClick={onRemoveAll}>
          Remove all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
