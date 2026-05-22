import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SurfacesTab } from "./SurfacesTab";
import { SourceReceiversTab } from "./SourceReceiversTab";
import { SettingTab } from "./SettingTab";
import { useSelector, useDispatch } from "react-redux";
import { setActiveTab } from "@/store/tabSlice";
import type { RootState } from "@/store";

export function SidebarContent() {
  const activeTab = useSelector((state: RootState) => state.tab.activeTab);

  return (
    <Tabs
      value={activeTab}
      className="relative h-full w-full overflow-visible"
      orientation="vertical"
    >
      <TabsContent value="surfaces">
        <SurfacesTab />
      </TabsContent>

      <TabsContent value="sources">
        <SourceReceiversTab />
      </TabsContent>

      <TabsContent value="settings">
        <SettingTab />
      </TabsContent>
    </Tabs>
  );
}

export function SidebarTabs() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state: RootState) => state.tab.activeTab);

  return (
    <Tabs value={activeTab}>
      <TabsList className="bg-transparent absolute bottom-0 h-[calc(100vh-4rem-174px)] w-8 p-0 flex-col rounded-r-xl roundedn-l-none z-50">
        <TabsTrigger
          value="sources"
          onClick={() => dispatch(setActiveTab("sources"))}
          className="w-full data-[state=active]:bg-choras-dark data-[state=active]:text-choras-primary text-white/50 flex items-center justify-center bg-choras-dark/50 rounded-l-none cursor-pointer pr-2"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            clipPath: "polygon(0 0, 1% 0, 100% 15%, 100% 85%, 1% 100%, 0 100%)",
          }}
        >
          Sources/Receivers
        </TabsTrigger>
        <TabsTrigger
          value="surfaces"
          onClick={() => dispatch(setActiveTab("surfaces"))}
          className="w-full data-[state=active]:bg-choras-dark data-[state=active]:text-choras-primary text-white/50 flex items-center justify-center bg-choras-dark/50 rounded-l-none cursor-pointer pr-2"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            clipPath: "polygon(0 0, 1% 0, 100% 15%, 100% 85%, 1% 100%, 0 100%)",
          }}
        >
          Surfaces
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          onClick={() => dispatch(setActiveTab("settings"))}
          className="w-full data-[state=active]:bg-choras-dark data-[state=active]:text-choras-primary text-white/50 flex items-center justify-center bg-choras-dark/50 rounded-l-none cursor-pointer pr-2"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            clipPath: "polygon(0 0, 1% 0, 100% 15%, 100% 85%, 1% 100%, 0 100%)",
          }}
        >
          Settings
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
