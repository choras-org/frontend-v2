import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGeometrySelection } from "@/hooks/useGeometrySelection";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useSelector } from "react-redux";
import { useGetMaterialsQuery } from "@/store/materialsApi";
import type { RootState } from "@/store";

export function GeometrySelectionInfo() {
  const { selectedGeometry } = useGeometrySelection();
  const surfaces = useSurfaces();
  const materialAssignments = useSelector(
    (state: RootState) => state.materialAssignment.assignments,
  );
  const { data: materials = [] } = useGetMaterialsQuery();

  const selectedSurfaceInfo = useMemo(() => {
    if (!selectedGeometry || selectedGeometry.mesh?.visible === false) return null;

    const surfaceIndex = surfaces.findIndex((surface) => surface.mesh === selectedGeometry.mesh);

    if (surfaceIndex === -1) return null;

    return {
      surface: surfaces[surfaceIndex],
      index: surfaceIndex + 1,
    };
  }, [selectedGeometry, surfaces]);

  const totalModelVolume = useMemo(() => {
    return surfaces.reduce((total, surface) => total + (surface.volume || 0), 0);
  }, [surfaces]);

  const totalSurfaceArea = useMemo(() => {
    return surfaces.reduce((total, surface) => total + (surface.area || 0), 0);
  }, [surfaces]);

  if (!selectedGeometry || selectedGeometry.mesh?.visible === false) {
    return (
      <Card className="w-80 border border-choras-gray gap-1">
        <CardHeader>
          <CardTitle className="text-xs">Geometry information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">Total volume:</span>
            </div>
            <div className="text-muted-foreground">{totalModelVolume.toFixed(2)} m³</div>
            <div>
              <span className="font-medium">Total surface area:</span>
            </div>
            <div className="text-muted-foreground">{totalSurfaceArea.toFixed(2)} m²</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Click on a face in the model to select it for material assignment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-85 border border-choras-gray gap-1">
      <CardHeader>
        <CardTitle className="text-xs">Selected surface</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Surface:</span>
          </div>
          <div className="text-muted-foreground">
            {selectedSurfaceInfo
              ? `Surface [${selectedSurfaceInfo.index}]`
              : selectedGeometry.mesh.name || "Unknown Surface"}
          </div>

          {selectedSurfaceInfo?.surface.area && (
            <>
              <div>
                <span className="font-medium">Surface area:</span>
              </div>
              <div className="text-muted-foreground">
                {selectedSurfaceInfo.surface.area.toFixed(2)} m²
              </div>
            </>
          )}

          <div>
            <span className="font-medium">Assigned material:</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {(() => {
              if (!selectedSurfaceInfo?.surface) {
                return "No material selected";
              }
              const surfaceKey = selectedSurfaceInfo.surface.id;
              const assignedMaterialId = materialAssignments[surfaceKey];
              if (!assignedMaterialId) {
                return "No material selected";
              }
              const material = materials.find((m) => m.id === assignedMaterialId);
              return material
                ? `${material.name} (ID: ${assignedMaterialId})`
                : `Material ID: ${assignedMaterialId}`;
            })()}
          </div>
        </div>

        {(() => {
          if (!selectedSurfaceInfo?.surface) return null;
          const surfaceKey = selectedSurfaceInfo.surface.id;
          const assignedMaterialId = materialAssignments[surfaceKey];
          if (!assignedMaterialId) return null;
          const material = materials.find((m) => m.id === assignedMaterialId);
          if (!material?.absorptionCoefficients) return null;

          const frequencyLabels = ["63Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz"];

          return (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs font-medium mb-2">Absorption Coefficients:</div>
              <div className="flex gap-4">
                {material.absorptionCoefficients.map((coeff, index) => (
                  <div key={index} className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] text-gray-700 font-mono font-medium">
                      {coeff.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-gray-500 font-medium">
                      {frequencyLabels[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
