import { selectActiveGroup } from "@/store/projectSelector";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setActiveGroup } from "@/store/projectSlice";
import type { RootState } from "@/store";

export function GroupPicker() {
  const groups = useSelector((state: RootState) => state.project.groups);
  const dispatch = useDispatch();
  const activeGroup = useSelector(selectActiveGroup);

  return (
    <Select onValueChange={(value) => dispatch(setActiveGroup(value))} value={activeGroup}>
      <SelectTrigger className="border-black/75 text-black/75 rounded-sm">
        <SelectValue placeholder="Select a group" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All groups</SelectItem>
        {groups.map((group) => (
          <SelectItem key={group} value={group}>
            {group}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
