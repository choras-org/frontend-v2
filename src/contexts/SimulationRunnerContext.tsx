import { createContext, useContext, useState, ReactNode } from "react";

interface SimulationRunnerContextType {
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

const SimulationRunnerContext = createContext<SimulationRunnerContextType | undefined>(undefined);

export function SimulationRunnerProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <SimulationRunnerContext.Provider value={{ isRunning, setIsRunning, progress, setProgress }}>
      {children}
    </SimulationRunnerContext.Provider>
  );
}

export function useSimulationRunnerContext() {
  const context = useContext(SimulationRunnerContext);
  if (context === undefined) {
    throw new Error("useSimulationRunnerContext must be used within a SimulationRunnerProvider");
  }
  return context;
}
