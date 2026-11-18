import { useState, useEffect } from "react";
import { SIDEBAR_WIDTH } from "@/constants";

// Must match the maxSize used by the sidebar ResizablePanel in AppLayout.
// Keeping minSize/defaultSize at or below this prevents an invalid
// "min size greater than max size" panel configuration, which otherwise
// throws react-resizable-panels into an infinite update loop.
const MAX_SIDEBAR_SIZE = 60;

export function useSidebarResize() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarPixelWidth, setSidebarPixelWidth] = useState(SIDEBAR_WIDTH);

  const minSidebarPx = SIDEBAR_WIDTH;
  const sidebarMinSize = Math.min((minSidebarPx / windowWidth) * 100, MAX_SIDEBAR_SIZE);
  const sidebarDefaultSize = Math.min(
    Math.max((sidebarPixelWidth / windowWidth) * 100, sidebarMinSize),
    MAX_SIDEBAR_SIZE,
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSidebarResize = (size: number) => {
    // Track the actual pixel width when user resizes
    const pixelWidth = (size / 100) * windowWidth;
    setSidebarPixelWidth(Math.max(pixelWidth, minSidebarPx));
  };

  return {
    windowWidth,
    sidebarMinSize,
    sidebarDefaultSize,
    handleSidebarResize,
    sidebarPixelWidth,
  };
}
