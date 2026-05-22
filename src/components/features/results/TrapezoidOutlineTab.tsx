import { cn } from "@/libs/style";

interface TrapezoidOutlineTabProps {
  value: string;
  children: React.ReactNode;
  "data-state"?: string;
}

export function TrapezoidOutlineTab({ value, children, ...restProps }: TrapezoidOutlineTabProps) {
  return (
    <button
      {...restProps}
      value={value}
      className={cn(
        "relative text-sm font-medium h-full w-8 flex items-center justify-center cursor-pointer transition-colors",
        "text-black/50 hover:text-black",
        "data-[state=active]:text-black",
      )}
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          data-state={restProps["data-state"]}
          points="0,0 1,0 100,15 100,85 1,100 0,100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          shapeRendering="crispEdges"
          className="transition-colors stroke-black/50 data-[state=active]:stroke-black"
        />
      </svg>
      {/* Content */}
      <span className="relative z-10 px-4">{children}</span>
    </button>
  );
}
