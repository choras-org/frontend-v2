import { EmptySimulation } from "@/components/features/EmptySimulation";
import { AppLayout } from "@/components/ui/app-layout";
import { useGetSimulationsByModelIdQuery } from "@/store/simulationApi";
import { setActiveSimulation } from "@/store/simulationSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { SimulationPicker } from "@/components/features/simulationSettings/SimulationPicker";
import { SidebarContent, SidebarTabs } from "@/components/features/simulationSettings/SidebarTabs";
import { ModelViewer } from "@/components/features/viewport/ModelViewer";
import { useGetModelQuery, useGetModelSimulationCompatibilityQuery } from "@/store/modelApi";
import type { CompatibilityStatus } from "@/types/model";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EditorNav } from "@/components/features/viewport/EditorNav";
import { clearSelection } from "@/store/geometrySelectionSlice";
import { setCompatibilityData } from "@/store/simulationSettingsSlice";
import type { CompatibilityIssue } from "@/types/simulationSettings";

type CompatibilityMethod = {
  simulationType: string;
  label?: string | null;
  compatible: string;
  issues: CompatibilityIssue[];
};

type CompatibilityBlock = {
  methods: CompatibilityMethod[];
};

export function EditorPage() {
  const navigate = useNavigate();
  const { modelId, simulationId } = useParams() as { modelId: string; simulationId?: string };
  const { data: simulations } = useGetSimulationsByModelIdQuery(+modelId);
  const { data: model } = useGetModelQuery(modelId);
  const { data: compatibilityData } = useGetModelSimulationCompatibilityQuery(modelId);
  const dispatch = useDispatch();

  // If no simulationId is provided, redirect to the first simulation
  // Once the simulations are created, the effect will run again
  useEffect(() => {
    if (simulations && simulations.length > 0) {
      // If simulationId is provided, find the active simulation and set it in the store
      if (simulationId) {
        const activeSimulation = simulations.find((sim) => sim.id === +simulationId);
        if (activeSimulation) {
          dispatch(setActiveSimulation(activeSimulation));
          return;
        }
      }

      // If no simulationId or invalid simulationId, redirect to the first simulation
      const { id: firstSimulationId } = simulations[0];
      navigate(`/editor/${modelId}/${firstSimulationId}`, { replace: true });
    }
  }, [simulations, simulationId, modelId, navigate, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch]);

  // Setup compatibility data for both initial and repaired stages
  useEffect(() => {
    if (compatibilityData) {
      const processBlockData = (block: CompatibilityBlock) => {
        return block.methods.map((method: CompatibilityMethod) => {
          const issuesRecord: Record<
            string,
            { compatibility: string; label: string; present: boolean }
          > = {};
          if (Array.isArray(method.issues)) {
            method.issues.forEach((issue: CompatibilityIssue) => {
              issuesRecord[issue.kind] = {
                compatibility: issue.compatibility || "unknown",
                label: issue.label || "Unknown",
                present: issue.present,
              };
            });
          }

          return {
            simulationType: method.simulationType,
            label: method.label ?? null,
            compatible: method.compatible as CompatibilityStatus,
            issues: issuesRecord,
          };
        });
      };

      if (compatibilityData.initialCompatibility) {
        const initialCompatData = processBlockData(compatibilityData.initialCompatibility);
        dispatch(setCompatibilityData({ stage: "initial", data: initialCompatData }));
      }

      if (compatibilityData.repairedCompatibility) {
        const repairedCompatData = processBlockData(compatibilityData.repairedCompatibility);
        dispatch(setCompatibilityData({ stage: "repaired", data: repairedCompatData }));
      }
    }
  }, [compatibilityData, dispatch]);

  return (
    <AppLayout
      title={
        model && (
          <Breadcrumb
            items={[
              {
                label: model.projectName,
                href: `/projects/${model.projectId}`,
              },
              {
                label: model.modelName,
                isActive: true,
              },
            ]}
          />
        )
      }
      sidebar={
        <div className="h-full flex flex-col">
          {simulationId ? (
            <>
              <div className="p-4 flex-shrink-0">
                <SimulationPicker modelId={+modelId} simulationId={+simulationId} />
              </div>
              <hr className="border-choras-gray border-0.5" />
              <div className="flex-1 px-4 overflow-y-auto scrollbar-hide">
                <SidebarContent />
              </div>
            </>
          ) : (
            <EmptySimulation modelId={+modelId} />
          )}
        </div>
      }
    >
      {simulationId && (
        <>
          <SidebarTabs />
          <EditorNav
            key={`editor-nav-${modelId}-${simulationId}`}
            active="geometry"
            modelId={+modelId}
            simulationId={+simulationId}
          />
        </>
      )}
      <div className="h-full w-full">
        <ModelViewer modelId={modelId} simulationId={simulationId as string} />
      </div>
    </AppLayout>
  );
}
