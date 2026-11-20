import { createSelector } from "@reduxjs/toolkit/react";
import { simulationApi } from "./simulationApi";
import { FREQUENCY_BANDS } from "@/constants";
import { roundTo2 } from "@/helpers/number";
import type { Parameters } from "@/types/simulation";

import type { RootState } from "./index";
import { selectModelIdsByProjectId } from "./projectSelector";

// Selector to get the count of simulations for a given modelId
export const selectSimulationCountByModelId = (modelId: number) =>
  createSelector(
    (state: RootState) =>
      simulationApi.endpoints.getSimulationsByModelId.select(modelId)(state)?.data,
    (simulations) => (Array.isArray(simulations) ? simulations.length : 0),
  );

// Selector to get the total simulation count for a given projectId
export const selectSimulationCountByProjectId = createSelector(
  (projectId: number) => projectId,
  (projectId) => (state: RootState) => {
    const modelIds = selectModelIdsByProjectId(projectId)(state);
    let total = 0;
    for (const modelId of modelIds) {
      total += selectSimulationCountByModelId(modelId)(state);
    }
    return total;
  },
);

// Selector to get the active simulation from the state
export const selectActiveSimulation = (state: RootState) => state.simulation.activeSimulation;

// Selector to get compare results from the state
export const selectCompareResults = (state: RootState) => state.simulation.compareResults;

export const selectCompareSimulationIds = createSelector(selectCompareResults, (compareResults) =>
  compareResults
    .map((result) => result.simulationId)
    .filter((id) => id !== null)
    .map(Number),
);

// Selector to create chart "parameters" series data from compare results
export const selectCompareResultsSeriesData = (parameter: keyof Parameters) =>
  createSelector(
    (state: RootState) => state.simulation.compareResults,
    (state: RootState) => state,
    (compareResults, state) => {
      return compareResults
        .map((compareResult) => {
          const { simulationId, sourceId, receiverId, color, modelId } = compareResult;

          // Skip if simulation or receiver is not selected
          if (!simulationId || !receiverId || !sourceId) {
            return null;
          }

          // Get simulation result from RTK Query cache
          const resultState =
            simulationApi.endpoints.getSimulationResult.select(simulationId)(state);
          const results = resultState?.data;

          if (!results || results.length === 0) {
            return null;
          }

          // Get simulations for the modelId from RTK Query cache
          const simulationsState =
            simulationApi.endpoints.getSimulationsByModelId.select(modelId)(state);
          const simulations = simulationsState?.data;

          // Get simulation name
          const simulation = simulations?.find(
            (sim) => sim.id.toString() === simulationId.toString(),
          );
          const simulationName = simulation?.name || `Simulation ${simulationId}`;

          // Find the result for the selected source and receiver
          const result = results.find((res) => res.sourcePointId === sourceId);

          if (!result) {
            return null;
          }

          const response = result?.responses?.find((resp) => resp.pointId === receiverId);

          if (!response) {
            return null;
          }

          // Prepare series data
          const data = FREQUENCY_BANDS.map((freq) => {
            const paramValue = response.parameters[parameter];
            const index = result.frequencies.indexOf(freq);
            const value = paramValue[index];
            return value ? roundTo2(value) : null;
          });

          return {
            name: `${simulationName} - ${result.label} & ${response.label}`,
            color,
            data: data,
          };
        })
        .filter((series) => series !== null);
    },
  );
