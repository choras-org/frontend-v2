import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface CoordinateInputProps {
  value: number;
  axis: "x" | "y" | "z";
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
}

export function CoordinateInput({ value, axis, onChange, onCommit }: CoordinateInputProps) {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (parseFloat(localValue) !== value && !isNaN(value)) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commitValue(newValue);
    }, 500);
  };

  const commitValue = (val: string) => {
    const numValue = parseFloat(val);

    if (val === "" || isNaN(numValue)) {
      setLocalValue(String(0));
      return;
    }

    const roundedValue = parseFloat(numValue.toFixed(2));
    setLocalValue(roundedValue.toString());

    if (roundedValue !== value) {
      onChange(roundedValue);
      onCommit?.(roundedValue);
    }
  };

  const handleCommit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commitValue(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative flex-1">
      <span className="absolute left-2 top-1/2 transform -translate-y-[45%] text-sm text-white pointer-events-none uppercase">
        {axis}
      </span>
      <Input
        type="number"
        step="0.01"
        value={localValue}
        onChange={handleChange}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="h-6 text-sm bg-choras-dark border-choras-gray text-white pl-5.5 pr-2 py-3"
      />
    </div>
  );
}
