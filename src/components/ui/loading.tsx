import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/libs/style";

const loadingVariants = cva("animate-spin rounded-full border-b-2 border-gray-900", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface LoadingProps extends VariantProps<typeof loadingVariants> {
  message?: string;
  className?: string;
}

export function Loading({ message = "Loading...", className, size }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <div className={cn(loadingVariants({ size }))} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}
