import type React from "react";
import { useState } from "react"; // 1. Import useState
import { Link } from "react-router";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable";
import chorasLogoColour from "@/assets/choras_logo_colour.svg";
import chorasLogoWhite from "@/assets/choras_logo_white.svg";
import { useSidebarResize } from "@/hooks/useSidebarResize";
import { cn } from "@/libs/style";
import { PanelLeft, PanelRight } from "lucide-react";

type HeaderVariant = "default" | "light";

type AppLayoutProps = {
  title: React.ReactNode | string;
  right?: React.ReactNode;
  sidebar: React.ReactNode;
  rightSidebar?: React.ReactNode;
  children: React.ReactNode;
  headerVariant?: HeaderVariant;
  headerClassName?: string;
  showLeftSidebarToggle?: boolean;
  showRightSidebarToggle?: boolean;
};

export function AppLayout({
  title,
  right,
  sidebar,
  children,
  headerVariant = "default",
  headerClassName,
  rightSidebar,
  showLeftSidebarToggle = false,
  showRightSidebarToggle = false,
}: AppLayoutProps) {
  const { windowWidth, sidebarMinSize, sidebarDefaultSize, handleSidebarResize } =
    useSidebarResize();

  // 2. Tambahkan state untuk kontrol visibilitas sidebar
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const headerVariantClassName: Record<HeaderVariant, string> = {
    default: "bg-choras-dark",
    light: "bg-white border-b border-slate-300",
  };
  const isLightHeader = headerVariant === "light";

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header
        className={cn(
          "h-16 flex justify-between relative items-center",
          headerVariantClassName[headerVariant],
          headerClassName,
        )}
      >
        <div className="w-sidebar h-16 flex flex-1 items-center">
          {/* 3. Tombol Toggle Sidebar Kiri */}
          {showLeftSidebarToggle && (
            <button
              onClick={() => setShowLeftSidebar(() => !showLeftSidebar)}
              className="ml-3 transition"
            >
              {showLeftSidebar ? <PanelRight /> : <PanelLeft />}
            </button>
          )}

          <Link to="/" className="group inline-block ml-6">
            <img
              src={chorasLogoWhite}
              alt="CHORAS"
              className={cn("h-10", isLightHeader ? "hidden" : "group-hover:hidden")}
            />
            <img
              src={chorasLogoColour}
              alt="CHORAS"
              className={cn("h-10", isLightHeader ? "block" : "hidden group-hover:block")}
            />
          </Link>
        </div>
        {typeof title === "string" ? (
          <h1 className="text-center font-choras text-choras-primary text-2xl flex-2 font-bold">
            {title}
          </h1>
        ) : (
          <div className="flex-2">{title}</div>
        )}
        <div className="w-sidebar flex-1 flex justify-end items-center gap-3">
          {right}
          {/* 4. Tombol Toggle Sidebar Kanan (Hanya muncul jika prop rightSidebar dikirim) */}
          {rightSidebar && showRightSidebarToggle && (
            <button
              onClick={() => setShowRightSidebar(() => !showRightSidebar)}
              className="mr-3 transition"
            >
              {showRightSidebar ? <PanelLeft /> : <PanelRight />}
            </button>
          )}
        </div>
      </header>

      {/* Main Layout dengan Resizable Panels */}
      <ResizablePanelGroup
        direction="horizontal"
        key={`${windowWidth}-${showLeftSidebar}-${showRightSidebar}`}
      >
        {/* 5. Conditional Rendering Sidebar Kiri */}
        {showLeftSidebar && (
          <>
            <ResizablePanel
              minSize={sidebarMinSize}
              defaultSize={sidebarDefaultSize}
              maxSize={60}
              collapsedSize={sidebarMinSize}
              onResize={handleSidebarResize}
              className="bg-choras-dark border-t border-t-stone-600 z-40 min-w-83"
            >
              {sidebar}
            </ResizablePanel>
            <ResizableHandle className="bg-choras-dark" />
          </>
        )}

        {/* Konten Utama */}
        <ResizablePanel className="bg-[#dcdcdc]">
          <div className="h-full overflow-auto relative">{children}</div>
        </ResizablePanel>

        {/* 6. Conditional Rendering Sidebar Kanan */}
        {rightSidebar && showRightSidebar && (
          <>
            <ResizableHandle className="bg-choras-dark" />
            <ResizablePanel
              minSize={sidebarMinSize}
              defaultSize={sidebarDefaultSize}
              maxSize={60}
              collapsedSize={sidebarMinSize}
              onResize={handleSidebarResize}
              className="bg-choras-dark border-t border-t-stone-600 z-40 min-w-83"
            >
              {rightSidebar}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
