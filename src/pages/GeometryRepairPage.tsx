import GeometryIssueSidebar from "@/components/features/GeometryIssueSidebar";
import GeometryRepairSidebar from "@/components/features/GeometryRepairSidebar";
import { ModelViewer } from "@/components/features/viewport/ModelViewer";
import { AppLayout } from "@/components/ui/app-layout";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { CircleCheck, CircleHelp, OctagonAlert, TriangleAlert } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { clearGeometryIssues, clearRemainingIssues } from "@/store/geometryIssueSlice";
import { useGetModelQuery } from "@/store/modelApi";
import type { RootState } from "@/store";

const REPAIR_TOUR_HIDDEN_KEY = "choras:repair-tour-hidden:v1";

const issueSeverityDescription = renderToStaticMarkup(
  <div style={{ display: "grid", gap: 10, lineHeight: 1.4 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <CircleCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
      <span>This issue type will not break the selected simulation method.</span>
    </div>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <TriangleAlert size={18} color="#d97706" style={{ flexShrink: 0 }} />
      <span>This issue may affect or break the selected method and should be reviewed.</span>
    </div>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <OctagonAlert size={18} color="#dc2626" style={{ flexShrink: 0 }} />
      <span>
        This issue type is incompatible and must be resolved before using the selected method.
      </span>
    </div>
  </div>,
);

const repairTourSteps = [
  {
    element: '[data-tour="initial-sidebar"]',
    popover: {
      title: "Your original model",
      description:
        "This sidebar summarizes issues found in the geometry you uploaded, before any repairs were applied.",
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="initial-viewer"]',
    popover: {
      title: "Original model viewer",
      description: "Inspect and navigate your original 3D model here while reviewing its issues.",
    },
  },
  {
    element: '[data-tour="initial-simulation-methods"]',
    popover: {
      title: "Simulation compatibility",
      description:
        "Expand this section and select a simulation method. Its configuration updates the severity shown for every issue type, helping you see which issues block that method.",
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="initial-simulation-method-item"]',
    popover: {
      title: "Compatibility labels",
      description: `
        <div style="display: grid; gap: 10px; line-height: 1.4;">
          <div><strong style="color: #16a34a;">Supported</strong>: The model can be used with this simulation method.</div>
          <div><strong style="color: #d97706;">Warning</strong>: The method can run, but detected geometry issues may reduce the reliability of the simulation results.</div>
          <div><strong style="color: #dc2626;">Not Supported</strong>: The model has issues that prevent this simulation method from running.</div>
        </div>
      `,
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="initial-issues"]',
    popover: {
      title: "Detected geometry issues",
      description:
        "Issue types group the problems found in the original model. Expand a type, then click an issue to move the 3D camera to its location and highlight it.",
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="initial-issue-help"]',
    popover: {
      title: "Learn about an issue",
      description:
        "Hover over the question mark for a short explanation, or click it to open detailed documentation about that issue type.",
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="initial-issue-severity"]',
    popover: {
      title: "Issue severity icons",
      description: issueSeverityDescription,
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="initial-model-action"]',
    popover: {
      title: "Use the initial model",
      description:
        "Choose this option to continue with your original geometry instead of the repaired version. This button is enabled only when at least one simulation method supports the initial model.",
      side: "right" as const,
    },
  },
  {
    element: '[data-tour="repaired-sidebar"]',
    popover: {
      title: "Your repaired model",
      description:
        "This sidebar reports the result of automatic repair. The viewer beside it shows the repaired version for comparison.",
      side: "left" as const,
    },
  },
  {
    element: '[data-tour="repaired-viewer"]',
    popover: {
      title: "Repaired model viewer",
      description: "Inspect the repaired 3D geometry here and compare it with the original model.",
    },
  },
  {
    element: '[data-tour="repaired-simulation-methods"]',
    popover: {
      title: "Repaired model compatibility",
      description:
        "Select a method to check whether the repaired geometry can be used with your preferred simulation method.",
      side: "left" as const,
    },
  },
  {
    element: '[data-tour="repaired-issues"]',
    popover: {
      title: "Remaining issues",
      description:
        "Problems that could not be fixed automatically appear here. Click an issue to locate and highlight it in the repaired model.",
      side: "left" as const,
    },
  },
  {
    element: '[data-tour="repaired-model-actions"]',
    popover: {
      title: "Choose which model to use",
      description:
        "Accept the repaired model here, or use the original model from the left sidebar. This button is enabled only when at least one simulation method supports that model.",
      side: "left" as const,
    },
  },
  {
    element: '[data-tour="download-repaired-model"]',
    popover: {
      title: "Download the repaired model",
      description:
        "Download the repaired geometry as an OBJ file for inspection or further editing.",
      side: "left" as const,
    },
  },
];

export function GeometryRepairPage() {
  const { modelId } = useParams() as { modelId: string };
  const dispatch = useDispatch();

  const { data: model } = useGetModelQuery(modelId);
  const selectedMethod = useSelector(
    (state: RootState) => state.simulationSettings.selectedSimulationMethod,
  );

  const geometryStatus = model?.geometryStatus ?? null;
  // Treat "model not yet loaded" as processing so we don't toast prematurely
  // while the query resolves (which would otherwise fire once before the status
  // is known and again after the repair completes).
  const isProcessing = !model || geometryStatus === "Pending" || geometryStatus === "Processing";

  // Track the last method we toasted for so a single selection never toasts
  // twice (e.g. from transient status transitions or StrictMode remounts).
  const lastToastedMethodId = useRef<string | number | null>(null);
  // Skip the toast for the initial auto-selected method; only toast once the
  // user actively changes the selection.
  const hasSeenInitialMethod = useRef(false);
  const hasStartedTour = useRef(false);

  const startRepairTour = () => {
    const availableSteps = repairTourSteps.filter(({ element }) => document.querySelector(element));
    let hideOnFutureVisits = localStorage.getItem(REPAIR_TOUR_HIDDEN_KEY) === "true";
    const tour = driver({
      animate: true,
      overlayColor: "#0f172a",
      overlayOpacity: 0.72,
      showProgress: true,
      allowClose: true,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Finish",
      steps: availableSteps,
      onPopoverRender: ({ footer }) => {
        if (footer.querySelector('[data-tour-preference="hide"]')) return;

        footer.style.display = "grid";
        footer.style.gridTemplateColumns = "1fr auto";
        footer.style.alignItems = "center";
        footer.style.gap = "12px";

        const preference = document.createElement("label");
        preference.dataset.tourPreference = "hide";
        preference.className =
          "flex min-h-10 w-full cursor-pointer items-center border-t border-slate-200 pt-3 text-sm font-medium leading-5 text-slate-700";
        preference.style.gridColumn = "1 / -1";
        preference.style.justifyContent = "flex-start";
        preference.style.columnGap = "8px";
        preference.style.textAlign = "left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = hideOnFutureVisits;
        checkbox.className = "h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-choras-primary)]";
        checkbox.addEventListener("change", () => {
          hideOnFutureVisits = checkbox.checked;
        });

        const preferenceText = document.createElement("span");
        preferenceText.textContent = "Don't show this tutorial again";
        preferenceText.style.flex = "0 1 auto";
        preferenceText.style.textAlign = "left";

        preference.append(checkbox, preferenceText);
        footer.append(preference);
      },
      onDestroyed: () => {
        if (hideOnFutureVisits) {
          localStorage.setItem(REPAIR_TOUR_HIDDEN_KEY, "true");
        } else {
          localStorage.removeItem(REPAIR_TOUR_HIDDEN_KEY);
        }
      },
    });

    tour.drive();
  };

  useEffect(() => {
    return () => {
      dispatch(clearGeometryIssues());
      dispatch(clearRemainingIssues());
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedMethod && !isProcessing && lastToastedMethodId.current !== selectedMethod.id) {
      lastToastedMethodId.current = selectedMethod.id;
      if (!hasSeenInitialMethod.current) {
        hasSeenInitialMethod.current = true;
        return;
      }
      toast.info(
        <div className="flex items-center gap-2">
          <div>
            <p className="font-semibold">"{selectedMethod.label}" selected</p>
            <p className="text-sm">
              Check issue types with <OctagonAlert size={14} className="inline text-red-600 mx-1" />{" "}
              to see which incompatible issues need attention.
            </p>
          </div>
        </div>,
        {
          duration: 5000,
        },
      );
    }
  }, [selectedMethod?.id, isProcessing]);

  useEffect(() => {
    if (
      isProcessing ||
      hasStartedTour.current ||
      localStorage.getItem(REPAIR_TOUR_HIDDEN_KEY) === "true"
    ) {
      return;
    }

    hasStartedTour.current = true;
    const startTimer = window.setTimeout(startRepairTour, 500);
    return () => window.clearTimeout(startTimer);
  }, [isProcessing]);

  return (
    <AppLayout
      title="Repair Page"
      headerVariant="light"
      sidebar={<GeometryIssueSidebar />}
      rightSidebar={<GeometryRepairSidebar />}
      showLeftSidebarToggle={true}
      showRightSidebarToggle={true}
      right={
        <button
          type="button"
          onClick={startRepairTour}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-choras-primary transition-colors hover:text-choras-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-choras-primary"
          aria-label="Replay repair page tutorial"
          title="Replay tutorial"
        >
          <CircleHelp className="h-5 w-5" />
        </button>
      }
    >
      <div className="h-full w-full flex">
        <div className="flex-1 h-full" data-tour="initial-viewer">
          <ModelViewer modelId={modelId} showGeometrySelectionInfo={false} source="InitialIssue" />
        </div>
        <div className="w-1 bg-border h-full" />
        <div className="flex-1 h-full" data-tour="repaired-viewer">
          <ModelViewer
            modelId={modelId}
            useClone
            isRepair={true}
            showGeometrySelectionInfo={false}
            source="RepairedIssue"
          />
        </div>
      </div>
    </AppLayout>
  );
}
