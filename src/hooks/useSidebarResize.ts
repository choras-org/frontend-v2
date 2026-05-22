import { useState, useEffect } from "react";
import { SIDEBAR_WIDTH } from "@/constants";

export function useSidebarResize() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarPixelWidth, setSidebarPixelWidth] = useState(SIDEBAR_WIDTH);

  const minSidebarPx = SIDEBAR_WIDTH;
  const sidebarMinSize = (minSidebarPx / windowWidth) * 100;
  const sidebarDefaultSize = (sidebarPixelWidth / windowWidth) * 100;

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
