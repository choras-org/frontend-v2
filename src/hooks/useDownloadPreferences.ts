import { useState, useEffect, useCallback } from "react";

export interface DownloadPreferences {
  parameterOptions: Record<string, boolean>;
  plotOptions: Record<string, boolean>;
  auralizationOptions: Record<string, boolean>;
  settingJsonOptions: boolean;
  parameters: boolean;
  plots: boolean;
  auralizations: boolean;
}

type ParameterOptionsType = {
  edt: boolean;
  t20: boolean;
  t30: boolean;
  c80: boolean;
  d50: boolean;
  ts: boolean;
  spl_t0_freq: boolean;
};

type PlotOptionsType = {
  "63Hz": boolean;
  "125Hz": boolean;
  "250Hz": boolean;
  "500Hz": boolean;
  "1000Hz": boolean;
  "2000Hz": boolean;
  "4000Hz": boolean;
  "8000Hz": boolean;
};

type AuralizationOptionsType = {
  wavIR: boolean;
  csvIR: boolean;
};

const DEFAULT_PARAMETER_OPTIONS: ParameterOptionsType = {
  edt: false,
  t20: false,
  t30: false,
  c80: false,
  d50: false,
  ts: false,
  spl_t0_freq: false,
};

const DEFAULT_PLOT_OPTIONS: PlotOptionsType = {
  "63Hz": false,
  "125Hz": false,
  "250Hz": false,
  "500Hz": false,
  "1000Hz": false,
  "2000Hz": false,
  "4000Hz": false,
  "8000Hz": false,
};

const DEFAULT_AURALIZATION_OPTIONS: AuralizationOptionsType = {
  wavIR: false,
  csvIR: false,
};

export function useDownloadPreferences(
  enabledFrequencies: number[],
  visibleSections: string[],
  allSelected?: boolean,
) {
  const [parameters, setParameters] = useState(false);
  const [plots, setPlots] = useState(false);
  const [auralizations, setAuralizations] = useState(false);
  const [parameterOptions, setParameterOptions] = useState(DEFAULT_PARAMETER_OPTIONS);
  const [plotOptions, setPlotOptions] = useState(DEFAULT_PLOT_OPTIONS);
  const [auralizationOptions, setAuralizationOptions] = useState(DEFAULT_AURALIZATION_OPTIONS);
  const [settingJsonOptions, setSettingJsonOptions] = useState(true);

  // Initialize from localStorage when not in allSelected mode
  useEffect(() => {
    if (allSelected || enabledFrequencies.length === 0) return;

    // Load auralization options
    if (visibleSections.includes("auralizations")) {
      const savedAuralization = localStorage.getItem("auralizationOptions");
      const aurOptions = savedAuralization
        ? JSON.parse(savedAuralization)
        : {
            wavIR: visibleSections.includes("auralizations"),
            csvIR: visibleSections.includes("auralizations"),
          };
      setAuralizationOptions(aurOptions);
      setAuralizations(!!savedAuralization || visibleSections.includes("auralizations"));
    }

    // Load parameter options
    if (visibleSections.includes("parameters")) {
      const savedParameters = localStorage.getItem("parameterOptions");
      const paramOptions = savedParameters
        ? JSON.parse(savedParameters)
        : {
            ...DEFAULT_PARAMETER_OPTIONS,
            edt: visibleSections.includes("parameters"),
            t20: visibleSections.includes("parameters"),
            t30: visibleSections.includes("parameters"),
            c80: visibleSections.includes("parameters"),
            d50: visibleSections.includes("parameters"),
            ts: visibleSections.includes("parameters"),
            spl_t0_freq: visibleSections.includes("parameters"),
          };
      setParameterOptions(paramOptions);
      setParameters(!!savedParameters || visibleSections.includes("parameters"));
    }

    // Load plot options
    if (visibleSections.includes("plots")) {
      const savedPlots = localStorage.getItem("plotOptions");
      const plotOpts = savedPlots
        ? JSON.parse(savedPlots)
        : {
            "63Hz": visibleSections.includes("plots") && enabledFrequencies.includes(63),
            "125Hz": visibleSections.includes("plots") && enabledFrequencies.includes(125),
            "250Hz": visibleSections.includes("plots") && enabledFrequencies.includes(250),
            "500Hz": visibleSections.includes("plots") && enabledFrequencies.includes(500),
            "1000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(1000),
            "2000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(2000),
            "4000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(4000),
            "8000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(8000),
          };
      setPlotOptions(plotOpts);
      setPlots(!!savedPlots || visibleSections.includes("plots"));
    }

    // Load settings json option
    const savedSettings = localStorage.getItem("settingJsonOptions");
    if (savedSettings) {
      setSettingJsonOptions(JSON.parse(savedSettings));
    }
  }, [enabledFrequencies, visibleSections, allSelected]);

  // Initialize with allSelected mode
  useEffect(() => {
    if (!allSelected || enabledFrequencies.length === 0) return;

    const paramOptions = {
      edt: visibleSections.includes("parameters"),
      t20: visibleSections.includes("parameters"),
      t30: visibleSections.includes("parameters"),
      c80: visibleSections.includes("parameters"),
      d50: visibleSections.includes("parameters"),
      ts: visibleSections.includes("parameters"),
      spl_t0_freq: visibleSections.includes("parameters"),
    };

    const plotOpts = {
      "63Hz": visibleSections.includes("plots") && enabledFrequencies.includes(63),
      "125Hz": visibleSections.includes("plots") && enabledFrequencies.includes(125),
      "250Hz": visibleSections.includes("plots") && enabledFrequencies.includes(250),
      "500Hz": visibleSections.includes("plots") && enabledFrequencies.includes(500),
      "1000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(1000),
      "2000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(2000),
      "4000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(4000),
      "8000Hz": visibleSections.includes("plots") && enabledFrequencies.includes(8000),
    };

    const aurOptions = {
      wavIR: visibleSections.includes("auralizations"),
      csvIR: visibleSections.includes("auralizations"),
    };

    setParameters(visibleSections.includes("parameters"));
    setPlots(visibleSections.includes("plots"));
    setAuralizations(visibleSections.includes("auralizations"));
    setParameterOptions(paramOptions);
    setPlotOptions(plotOpts);
    setAuralizationOptions(aurOptions);
  }, [enabledFrequencies, visibleSections, allSelected]);

  const updateParameterOptions = useCallback((options: ParameterOptionsType) => {
    setParameterOptions(options);
    localStorage.setItem("parameterOptions", JSON.stringify(options));
  }, []);

  const updatePlotOptions = useCallback((options: PlotOptionsType) => {
    setPlotOptions(options);
    localStorage.setItem("plotOptions", JSON.stringify(options));
  }, []);

  const updateAuralizationOptions = useCallback((options: AuralizationOptionsType) => {
    setAuralizationOptions(options);
    localStorage.setItem("auralizationOptions", JSON.stringify(options));
  }, []);

  const updateSettingJsonOptions = useCallback((value: boolean) => {
    setSettingJsonOptions(value);
    localStorage.setItem("settingJsonOptions", JSON.stringify(value));
  }, []);

  const resetAll = useCallback(() => {
    setParameters(false);
    setPlots(false);
    setAuralizations(false);
    setSettingJsonOptions(false);
    setParameterOptions(DEFAULT_PARAMETER_OPTIONS);
    setPlotOptions(DEFAULT_PLOT_OPTIONS);
    setAuralizationOptions(DEFAULT_AURALIZATION_OPTIONS);
  }, []);

  return {
    parameters,
    setParameters,
    plots,
    setPlots,
    auralizations,
    setAuralizations,
    parameterOptions,
    updateParameterOptions,
    plotOptions,
    updatePlotOptions,
    auralizationOptions,
    updateAuralizationOptions,
    settingJsonOptions,
    updateSettingJsonOptions,
    resetAll,
  };
}
