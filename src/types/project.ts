import type { Model } from "./model";
import type { SimulationRun } from "./simulation";

export interface Project {
  createdAt: string;
  description: string;
  group: string;
  id: number;
  models: Array<Model>;
  name: string;
  updatedAt: string;
}

export interface GroupProject {
  group: string;
  projects: Array<Project>;
}

export interface ProjectSimulation {
  group: string;
  modelCreatedAt: string;
  modelId: number;
  modelName: string;
  projectId: number;
  projectName: string;
  simulations: SimulationRun[];
}
