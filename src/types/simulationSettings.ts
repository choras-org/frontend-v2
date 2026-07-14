export interface SimulationSettingOption {
  id: string;
  name: string;
  type: "string" | "integer" | "float";
  display: "text" | "radio";
  default: string | number;
  min?: number;
  max?: number;
  step?: number;
  startAdornment?: string;
  endAdornment?: string;
  options?: Record<string, string>;
  description?: string;
}

export interface SimulationSettingsResponse {
  type: string;
  options: SimulationSettingOption[];
}

export interface CompatibilityIssue {
  kind: string;
  label?: string | null;
  compatibility?: string | null;
  present: boolean;
}

export interface MethodCompatibilityData {
  simulationType: string;
  label: string | null;
  compatible: "compatible" | "warning" | "incompatible" | "unknown";
  issues: Record<string, { compatibility: string; label: string; present: boolean }>;
}

export interface SimulationCompatibilityBlock {
  methods: MethodCompatibilityData[];
}

export interface SelectedSimulationMethod {
  id: string;
  label: string;
  compatible: "compatible" | "warning" | "incompatible" | "unknown";
}

export interface SimulationSettingsState {
  options: SimulationSettingOption[];
  values: Record<string, string | number>;
  loading: boolean;
  error: string | null;
  selectedMethodType: string;
  selectedResourceType: string;
  errors: Record<string, string>;
  selectedSimulationMethod: SelectedSimulationMethod | null;
  compatibilityData: MethodCompatibilityData[] | null;
}

export interface SimulationMethod {
  createdAt: string;
  description: string;
  documentationURL: string;
  label: string;
  repositoryURL: string;
  simulationType: string;
  updatedAt: string;
}
