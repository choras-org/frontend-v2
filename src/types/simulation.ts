export interface Simulation {
  completedAt: string;
  createdAt: string;
  description: string;
  hasBeenEdited: boolean;
  id: number;
  layerIdByMaterialId: Record<string, number>;
  modelId: number;
  name: string;
  receivers: Receiver[];
  settingsPreset: string;
  simulationRun: SimulationRun;
  simulationRunId: number;
  solverSettings: SolverSettings;
  sources: Source[];
  status: string;
  taskType: string;
  updatedAt: string;
}

export interface Receiver {
  id: string;
  isValid: boolean;
  label: string;
  orderNumber: number;
  x: number;
  y: number;
  z: number;
  validationError?: string;
}

export interface SimulationRun {
  completedAt: string;
  createdAt: string;
  id: number;
  layerIdByMaterialId: Record<string, number>;
  percentage: number;
  receivers: Receiver[];
  settingsPreset: string;
  simulation: Simulation;
  solverSettings: SolverSettings;
  sources: Source2[];
  status: string;
  taskType: string;
  updatedAt: string;
}

export interface Simulation {
  completedAt: string;
  createdAt: string;
  description: string;
  hasBeenEdited: boolean;
  id: number;
  layerIdByMaterialId: Record<string, number>;
  model: Model;
  modelId: number;
  name: string;
  receivers: Receiver[];
  settingsPreset: string;
  simulationRunId: number;
  solverSettings: SolverSettings;
  sources: Source[];
  status: string;
  taskType: string;
  updatedAt: string;
}

export interface Model {
  id: number;
  modelName: string;
  projectId: number;
  projectName: string;
  projectTag: string;
}

export interface SolverSettings {
  simulationSettings: object;
}

export interface Source {
  id: string;
  label: string;
  orderNumber: number;
  x: number;
  y: number;
  z: number;
  isValid?: boolean;
  validationError?: string;
}

export interface Source2 {
  label: string;
  orderNumber: number;
  percentage: number;
  sourcePointId: string;
  taskStatuses: TaskStatus[];
}

export interface TaskStatus {
  id: number;
  message: unknown;
  percentage: number;
  sourcePointId: string;
  status: string;
  taskType: string;
}

export interface SimulationResult {
  frequencies: number[];
  label: string;
  orderNumber: number;
  percentage: number;
  responses: Response[];
  resultType: string;
  sourcePointId: string;
  sourceX: number;
  sourceY: number;
  sourceZ: number;
}

export interface Response {
  label: string;
  orderNumber: number;
  parameters: Parameters;
  pointId: string;
  receiverResults: ReceiverResult[];
  x: number;
  y: number;
  z: number;
}

export interface Parameters {
  c80: number[];
  d50: number[];
  edt: number[];
  spl_t0_freq: number[];
  t20: number[];
  t30: number[];
  ts: number[];
}

export interface ReceiverResult {
  data: number[];
  frequency: number;
  t: number[];
  type: string;
}
