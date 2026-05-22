import { createSelector } from "@reduxjs/toolkit/react";
import { simulationApi } from "./simulationApi";
import { FREQUENCY_BANDS } from "@/constants";
import { roundTo2 } from "@/helpers/number";
import type { Parameters } from "@/types/simulation";

import type { RootState } from "./index";
import { selectModelIdsByProjectId } from "./projectSelector";

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, factor: number): string {
  // Remove # if present
  const color = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Adjust brightness
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);

  // Convert back to hex
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

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

// Selector to create chart "plots" series data from compare results
export const selectCompareResultsPlotsSeriesData = (frequencies: number[]) =>
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

          // Prepare series data from receiverResults where x = t and y = data
          // Filter receiverResults by the selected frequencies
          const filteredReceiverResults = response.receiverResults.filter((receiverResult) =>
            frequencies.includes(receiverResult.frequency),
          );

          // Create series data for each frequency
          const seriesData = filteredReceiverResults.map((receiverResult) => {
            const timeArray = receiverResult.t;
            const dataArray = receiverResult.data;
            const timeStep = 0.02; // Sample every 0.02 seconds

            const coordinatePairs: [number, number][] = [];

            // Find the closest data point for each 0.02 time step
            let currentTime = 0;
            const maxTime = Math.max(...timeArray);

            // Calculate the number of steps needed to cover the full range
            // Round up to the next 0.02 interval to ensure we include the final time point
            const finalTime = Math.ceil(maxTime / timeStep) * timeStep;
            const totalSteps = Math.round(finalTime / timeStep) + 1;

            for (let step = 0; step < totalSteps; step++) {
              currentTime = step * timeStep;

              // Only include points if we have corresponding data (don't extrapolate beyond original data)
              if (currentTime > maxTime + timeStep / 2) {
                break;
              }

              // Find the closest time value in the original data
              let closestIndex = 0;
              let minDifference = Math.abs(timeArray[0] - currentTime);

              for (let i = 1; i < timeArray.length; i++) {
                const difference = Math.abs(timeArray[i] - currentTime);
                if (difference < minDifference) {
                  minDifference = difference;
                  closestIndex = i;
                }
              }

              // Add the data point
              coordinatePairs.push([
                Math.round(currentTime * 100) / 100, // Round to 2 decimal places for clean time values
                roundTo2(dataArray[closestIndex] || 0),
              ]);
            }

            // Create a color variation based on frequency
            // Higher frequencies get darker, lower frequencies get lighter
            const maxFrequency = Math.max(...filteredReceiverResults.map((r) => r.frequency));
            const minFrequency = Math.min(...filteredReceiverResults.map((r) => r.frequency));
            const frequencyRange = maxFrequency - minFrequency;

            let adjustedColor = color;
            if (frequencyRange > 0) {
              // Calculate darkness factor (0 = lightest, 1 = darkest)
              const darknessFactor = (receiverResult.frequency - minFrequency) / frequencyRange;
              adjustedColor = adjustColorBrightness(color, 1 - darknessFactor * 0.6); // 0.4 to 1.0 brightness range
            }

            return {
              name: `${simulationName} - ${result.label} & ${response.label} (${receiverResult.frequency}Hz)`,
              color: adjustedColor,
              data: coordinatePairs,
              frequency: receiverResult.frequency,
            };
          });

          return seriesData;
        })
        .filter((series) => series !== null)
        .flat(); // Flatten since each compareResult now returns an array of series
    },
  );
