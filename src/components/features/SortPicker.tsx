import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortPickerProps = {
  onValueChange?: (value: string) => void;
  value?: string;
};

export function SortPicker({ onValueChange, value }: SortPickerProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="border-black/75 text-black/75 rounded-sm">
        <SelectValue placeholder="Select a group" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ASC">Name: A-Z</SelectItem>
        <SelectItem value="DESC">Name: Z-A</SelectItem>
        <SelectItem value="NEWEST_FIRST">Newest first</SelectItem>
        <SelectItem value="LAST_MODIFIED">Last modified</SelectItem>
      </SelectContent>
    </Select>
  );
}
