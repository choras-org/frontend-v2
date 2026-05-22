import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCompareResult,
  clearCompareResults,
  initializeCompareResults,
} from "@/store/simulationSlice";
import type { RootState } from "@/store";
import { useEffect } from "react";
import { CompareResultItem } from "./CompareResultItem";
import { COLORS } from "@/constants";
import { selectCompareResults } from "@/store/simulationSelector";

interface CompareResultProps {
  modelId: number;
}

const colorVariants = [
  COLORS.PRIMARY,
  COLORS.SECONDARY,
  COLORS.ACCENT,
  "lightgreen",
  "silver",
  "lightpink",
  "darkorange",
  "lightyellow",
  "tomato",
  "gold",
];

export function CompareResult({ modelId }: CompareResultProps) {
  const dispatch = useDispatch();
  const compareResults = useSelector(selectCompareResults);
  const activeSimulation = useSelector((state: RootState) => state.simulation.activeSimulation);

  // Initialize with one result if empty, using activeSimulation
  useEffect(() => {
    if (compareResults.length === 0 && activeSimulation) {
      dispatch(
        initializeCompareResults([
          {
            id: "1",
            simulationId: activeSimulation.id,
            modelId: activeSimulation.modelId,
            sourceId:
              activeSimulation.sources.length > 0
                ? activeSimulation.sources[0].id.toString()
                : null,
            receiverId:
              activeSimulation.receivers.length > 0
                ? activeSimulation.receivers[0].id.toString()
                : null,
            color: colorVariants[0],
          },
        ]),
      );
    }
  }, [dispatch, compareResults.length, activeSimulation]);

  useEffect(() => {
    return () => {
      dispatch(clearCompareResults());
    };
  }, []);

  const handleAddResult = () => {
    const lastId = compareResults.length > 0 ? compareResults[compareResults.length - 1].id : "0";
    const newId = (parseInt(lastId) + 1).toString();
    const newColor = colorVariants[compareResults.length % colorVariants.length];
    dispatch(
      addCompareResult({
        id: newId,
        modelId: modelId,
        simulationId: null,
        sourceId: null,
        receiverId: null,
        color: newColor,
      }),
    );
  };

  return (
    <div className="overflow-y-auto h-full">
      <h2 className="font-choras text-2xl p-4 font-semibold text-choras-accent">Results</h2>

      {compareResults.map((result, idx) => (
        <CompareResultItem
          key={result.id}
          order={idx + 1}
          id={result.id}
          simulationId={result.simulationId}
          sourceId={result.sourceId}
          receiverId={result.receiverId}
          color={result.color}
          modelId={result.modelId}
          isCurrent={idx === 0 && result.simulationId === activeSimulation?.id}
        />
      ))}

      <div className="m-4">
        <Button onClick={handleAddResult} variant="outline" className="w-full">
          <Plus size={20} className="mr-1" />
          Add result
        </Button>
      </div>
    </div>
  );
}
