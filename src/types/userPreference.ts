export interface UserPreference {
  id: string;
  settings: {
    hideSimulationSettingErrors: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
