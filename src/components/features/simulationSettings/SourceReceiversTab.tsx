import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { SourceReceiversMenu } from "./SourceReceiversMenu";
import { CoordinateInput } from "./CoordinateInput";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Source, Receiver } from "@/types/simulation";
import type { RootState } from "@/store";
import {
  addSource,
  // removeSource,
  removeAllSources,
  updateSource,
  updateSourceValidation,
  addReceiver,
  // removeReceiver,
  removeAllReceivers,
  updateReceiver,
  updateReceiverValidation,
  selectSource,
  selectReceiver,
  setSources,
  setReceivers,
} from "@/store/sourceReceiverSlice";
import { setHighlightedElement } from "@/store/tabSlice";
import { useSourceReceiverApi } from "@/hooks/useSourceReceiverApi";
import { toast } from "sonner";
import { useSurfaces } from "@/hooks/useSurfaces";
import { validateSourceOrReceiver, getModelBounds } from "@/helpers/sourceReceiverValidation";

export function SourceReceiversTab() {
  const dispatch = useDispatch();
  const sources = useSelector((state: RootState) => state.sourceReceiver.sources);
  const receivers = useSelector((state: RootState) => state.sourceReceiver.receivers);
  const selectedSource = useSelector((state: RootState) => state.sourceReceiver.selectedSource);
  const selectedReceiver = useSelector((state: RootState) => state.sourceReceiver.selectedReceiver);
  const highlightedElement = useSelector((state: RootState) => state.tab.highlightedElement);

  const currentModelId = useSelector((state: RootState) => state.model.currentModelId);
  const currentModel = useSelector((state: RootState) =>
    currentModelId ? state.model.rhinoFiles[currentModelId] : null,
  );
  const modelObject3D = currentModel?.object3D || null;

  const { simulation, simulationError, updateSimulationData, updateReceiversData } =
    useSourceReceiverApi();
  const surfaces = useSurfaces();

  const validateReceiver = (receiver: Receiver): Receiver => {
    const modelBounds = getModelBounds(surfaces);
    const validation = validateSourceOrReceiver(
      { x: receiver.x, y: receiver.y, z: receiver.z },
      modelBounds,
      sources,
      surfaces,
      receiver.id,
      "receiver",
      modelObject3D,
    );

    return {
      ...receiver,
      isValid: validation.isValid,
      validationError: validation.validationError,
    };
  };

  const validateSource = (source: Source): Source => {
    const modelBounds = getModelBounds(surfaces);
    const validation = validateSourceOrReceiver(
      { x: source.x, y: source.y, z: source.z },
      modelBounds,
      receivers,
      surfaces,
      source.id,
      "source",
      modelObject3D,
    );

    return {
      ...source,
      isValid: validation.isValid,
      validationError: validation.validationError,
    };
  };

  useEffect(() => {
    if (simulation?.sources && surfaces.length > 0) {
      const validatedSources = simulation.sources.map(validateSource);
      dispatch(setSources(validatedSources));
    }
  }, [simulation?.sources, surfaces, dispatch]);

  useEffect(() => {
    if (simulation?.receivers && surfaces.length > 0) {
      const validatedReceivers = simulation.receivers.map(validateReceiver);
      dispatch(setReceivers(validatedReceivers));
    }
  }, [simulation?.receivers, surfaces, dispatch]);

  useEffect(() => {
    if (simulationError) {
      toast.error("Cannot load simulation data. Source/Receiver changes will not be saved.");
    }
  }, [simulationError]);

  // Clear highlighting after 3 seconds
  useEffect(() => {
    if (highlightedElement) {
      const timer = setTimeout(() => {
        dispatch(setHighlightedElement(null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedElement, dispatch]);

  useEffect(() => {
    if (sources.length > 0 && surfaces.length > 0) {
      const validatedReceivers = receivers.map(validateReceiver);
      const hasChanges = validatedReceivers.some((newReceiver, index) => {
        const oldReceiver = receivers[index];
        return (
          oldReceiver &&
          (newReceiver.isValid !== oldReceiver.isValid ||
            newReceiver.validationError !== oldReceiver.validationError)
        );
      });
      if (hasChanges) {
        dispatch(setReceivers(validatedReceivers));
      }
    }
  }, [sources, surfaces]);

  useEffect(() => {
    if (receivers.length > 0 && surfaces.length > 0) {
      const validatedSources = sources.map(validateSource);
      const hasChanges = validatedSources.some((newSource, index) => {
        const oldSource = sources[index];
        return (
          oldSource &&
          (newSource.isValid !== oldSource.isValid ||
            newSource.validationError !== oldSource.validationError)
        );
      });
      if (hasChanges) {
        dispatch(setSources(validatedSources));
      }
    }
  }, [receivers, surfaces]);

  const handleAddSource = () => {
    if (sources.length >= 1) return;

    const newSource: Source = {
      id: crypto.randomUUID(),
      label: `Source ${sources.length + 1}`,
      orderNumber: sources.length + 1,
      x: 1,
      y: 1,
      z: 1,
      isValid: true,
    };

    const validatedSource = validateSource(newSource);
    dispatch(addSource(validatedSource));

    const updatedSources = [...sources, validatedSource];
    updateSimulationData(updatedSources);
  };

  // commented out until backend supports multiple sources
  // const handleRemoveSource = (id: string) => {
  //   dispatch(removeSource(id));

  //   const updatedSources = sources.filter((source) => source.id !== id);
  //   updateSimulationData(updatedSources);
  // };

  const handleRemoveAllSources = () => {
    dispatch(removeAllSources());

    updateSimulationData([]);
  };

  const handleUpdateSource = (id: string, field: "x" | "y" | "z", value: number) => {
    dispatch(updateSource({ id, field, value }));

    const currentSource = sources.find((s) => s.id === id);
    if (currentSource) {
      const updatedSource = { ...currentSource, [field]: value };
      const validatedSource = validateSource(updatedSource);

      dispatch(
        updateSourceValidation({
          id,
          isValid: validatedSource.isValid || true,
          validationError: validatedSource.validationError,
        }),
      );

      const updatedSources = sources.map((source) => (source.id === id ? validatedSource : source));
      updateSimulationData(updatedSources);
    }
  };

  const handleAddReceiver = () => {
    if (receivers.length >= 1) return;

    const newReceiver: Receiver = {
      id: crypto.randomUUID(),
      label: `Receiver ${receivers.length + 1}`,
      orderNumber: receivers.length + 1,
      x: 3,
      y: 3,
      z: 1,
      isValid: true,
    };

    const validatedReceiver = validateReceiver(newReceiver);
    dispatch(addReceiver(validatedReceiver));

    const updatedReceivers = [...receivers, validatedReceiver];
    updateReceiversData(updatedReceivers);
  };

  // commented out until backend supports multiple receivers
  // const handleRemoveReceiver = (id: string) => {
  //   dispatch(removeReceiver(id));

  //   const updatedReceivers = receivers.filter((receiver) => receiver.id !== id);
  //   updateReceiversData(updatedReceivers);
  // };

  const handleRemoveAllReceivers = () => {
    dispatch(removeAllReceivers());

    updateReceiversData([]);
  };

  const handleUpdateReceiver = (id: string, field: "x" | "y" | "z", value: number) => {
    dispatch(updateReceiver({ id, field, value }));

    const currentReceiver = receivers.find((r) => r.id === id);
    if (currentReceiver) {
      const updatedReceiver = { ...currentReceiver, [field]: value };
      const validatedReceiver = validateReceiver(updatedReceiver);

      dispatch(
        updateReceiverValidation({
          id,
          isValid: validatedReceiver.isValid,
          validationError: validatedReceiver.validationError,
        }),
      );

      const updatedReceivers = receivers.map((receiver) =>
        receiver.id === id ? validatedReceiver : receiver,
      );
      updateReceiversData(updatedReceivers);
    }
  };

  const handleSourceClick = (sourceId: string) => {
    dispatch(selectSource(selectedSource === sourceId ? null : sourceId));
    if (selectedReceiver) {
      dispatch(selectReceiver(null));
    }
  };

  const handleReceiverClick = (receiverId: string) => {
    dispatch(selectReceiver(selectedReceiver === receiverId ? null : receiverId));
    if (selectedSource) {
      dispatch(selectSource(null));
    }
  };

  return (
    <>
      <div className="text-white border-b border-gray-600 pb-4 over">
        <div className="mb-4 flex justify-between items-center">
          <h4 className="text-xl text-choras-primary">Sources</h4>
          <SourceReceiversMenu onRemoveAll={handleRemoveAllSources} />
        </div>
        <div className="space-y-2">
          {sources.length === 0 ? (
            <div className="text-xs text-gray-500 italic py-2">Add new source to start editing</div>
          ) : (
            <>
              {sources.map((source) => {
                const isSelected = selectedSource === source.id;
                const hasValidationError = !source.isValid && source.validationError;
                return (
                  <div
                    key={source.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSourceClick(source.id);
                    }}
                    className={`text-xs p-2 ${
                      isSelected
                        ? "bg-yellow-500/20 border border-yellow-500/30"
                        : hasValidationError
                          ? "bg-red-500/20 border border-red-500/30"
                          : "hover:bg-gray-700/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 py-3">
                      <div
                        className={`flex items-center justify-center w-6 h-6 border-2 border-[#667eea] text-[#667eea] rounded-full text-xs font-bold flex-shrink-0`}
                      >
                        {source.orderNumber}
                      </div>
                      <div className="flex gap-1 flex-1">
                        <CoordinateInput
                          value={source.x}
                          axis="x"
                          onChange={(value) => handleUpdateSource(source.id, "x", value)}
                        />
                        <CoordinateInput
                          value={source.y}
                          axis="y"
                          onChange={(value) => handleUpdateSource(source.id, "y", value)}
                        />
                        <CoordinateInput
                          value={source.z}
                          axis="z"
                          onChange={(value) => handleUpdateSource(source.id, "z", value)}
                        />
                      </div>
                      {/* Commented out removal individual button until backend supports multiple sources */}
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSource(source.id);
                        }}
                        className="p-1 h-6 w-6 text-choras-gray hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </Button> */}
                    </div>
                    {hasValidationError && (
                      <div className="mt-2 text-xs text-red-400 px-1">
                        Error: {source.validationError}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="mt-3">
          <Button
            onClick={handleAddSource}
            disabled={sources.length >= 1}
            size="sm"
            className={`w-full h-8 text-xs cursor-pointer transition-all duration-500 ${
              highlightedElement === "add-source-button"
                ? "ring-2 ring-yellow-400 shadow-lg animate-pulse bg-yellow-500/20"
                : ""
            }`}
            variant="outline"
          >
            <Plus size={14} className="mr-1" />
            Add New Source {sources.length >= 1 && "(Max 1)"}
          </Button>
        </div>
      </div>

      <div className="text-white pt-4">
        <div className="mb-4 flex justify-between items-center">
          <h4 className="text-xl text-choras-primary">Receivers</h4>
          <SourceReceiversMenu onRemoveAll={handleRemoveAllReceivers} />
        </div>
        <div className="space-y-2">
          {receivers.length === 0 ? (
            <div className="text-xs text-gray-500 italic py-2">
              Add new receiver to start editing
            </div>
          ) : (
            <>
              {receivers.map((receiver) => {
                const isSelected = selectedReceiver === receiver.id;
                const hasValidationError = !receiver.isValid && receiver.validationError;
                return (
                  <div
                    key={receiver.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReceiverClick(receiver.id);
                    }}
                    className={`text-xs p-2 ${
                      isSelected
                        ? "bg-yellow-500/20 border border-yellow-500/30"
                        : hasValidationError
                          ? "bg-red-500/20 border border-red-500/30"
                          : "hover:bg-gray-700/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 py-3">
                      <div
                        className={`flex items-center justify-center w-6 h-6 border-2 border-[#eac766] text-[#eac766] rounded-full text-xs font-bold flex-shrink-0`}
                      >
                        {receiver.orderNumber}
                      </div>
                      <div className="flex gap-1 flex-1">
                        <CoordinateInput
                          value={receiver.x}
                          axis="x"
                          onChange={(value) => handleUpdateReceiver(receiver.id, "x", value)}
                        />
                        <CoordinateInput
                          value={receiver.y}
                          axis="y"
                          onChange={(value) => handleUpdateReceiver(receiver.id, "y", value)}
                        />
                        <CoordinateInput
                          value={receiver.z}
                          axis="z"
                          onChange={(value) => handleUpdateReceiver(receiver.id, "z", value)}
                        />
                      </div>
                      {/* Commented out removal individual button until backend supports multiple receivers */}
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveReceiver(receiver.id);
                        }}
                        className="p-1 h-6 w-6 text-choras-gray hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </Button> */}
                    </div>
                    {hasValidationError && (
                      <div className="mt-2 text-xs text-red-400 px-1">
                        Error: {receiver.validationError}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="mt-3">
          <Button
            onClick={handleAddReceiver}
            disabled={receivers.length >= 1}
            size="sm"
            className={`w-full h-8 text-xs mb-4 cursor-pointer transition-all duration-500 ${
              highlightedElement === "add-receiver-button"
                ? "ring-2 ring-yellow-400 shadow-lg animate-pulse bg-yellow-500/20"
                : ""
            }`}
            variant="outline"
          >
            <Plus size={14} className="mr-1" />
            Add New Receiver {receivers.length >= 1 && "(Max 1)"}
          </Button>
        </div>
      </div>
    </>
  );
}
