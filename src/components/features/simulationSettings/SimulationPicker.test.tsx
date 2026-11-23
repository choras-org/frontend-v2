// Tests for choras-org/CHORAS#89: loading a simulation must not overwrite its stored method or settings
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SimulationPicker } from "./SimulationPicker";

const mocks = vi.hoisted(() => ({
  simulations: [] as object[],
  model: {} as object,
  repairedCompatibilityData: null as object[] | null,
  updateSimulation: vi.fn(),
  initializeSettings: vi.fn(),
}));

// A native select instead of Radix, so the tests can pick a method with one change event
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (v: string) => void;
    children: ReactNode;
  }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    disabled,
    children,
  }: {
    value: string;
    disabled?: boolean;
    children: ReactNode;
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}));
vi.mock("@/store/simulationApi", () => ({
  useDeleteSimulationMutation: () => [vi.fn()],
  useGetSimulationsByModelIdQuery: () => ({ data: mocks.simulations, isLoading: false }),
  useLazyGetSimulationsByModelIdQuery: () => [vi.fn()],
  useUpdateSimulationMutation: () => [mocks.updateSimulation],
}));
vi.mock("@/store/simulationSettingsApi", () => ({
  useGetSimulationMethodsQuery: () => ({
    data: [
      { simulationType: "DE", label: "Diffusion Equation method" },
      { simulationType: "misuka", label: "Pyroomacoustics method" },
      { simulationType: "sparrowpy", label: "sparrowpy method" },
    ],
    isLoading: false,
  }),
}));
vi.mock("@/store/modelApi", () => ({ useGetModelQuery: () => ({ data: mocks.model }) }));
vi.mock("react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (select: (state: object) => unknown) =>
    select({
      simulationSettings: {
        selectedMethodType: "DE",
        selectedResourceType: "LOCAL",
        initialCompatibilityData: null,
        repairedCompatibilityData: mocks.repairedCompatibilityData,
      },
    }),
}));
vi.mock("@/hooks/useDuplicateSimulation", () => ({
  useDuplicateSimulation: () => ({ duplicateSimulation: vi.fn() }),
}));
vi.mock("@/hooks/useInitializeSimulationSettings", () => ({
  useInitializeSimulationSettings: () => ({ initializeSettings: mocks.initializeSettings }),
}));
vi.mock("@/hooks/useSimulationRunner", () => ({
  useSimulationRunner: () => ({ isRunning: false }),
}));
vi.mock("../SimulationForm", () => ({ SimulationForm: () => null }));
vi.mock("@/components/ui/confirm-dialog", () => ({ ConfirmDialog: () => null }));
vi.mock("./MethodInfoDialog", () => ({ MethodInfoDialog: () => null }));

const simulation = (id: number, simulationMethod: string) => ({
  id,
  modelId: 1,
  name: `sim ${id}`,
  status: "Created",
  hasBeenEdited: false,
  simulationMethod,
  solverSettings: { simulationSettings: { edt: 70 } },
  resourceType: "LOCAL",
  sources: [],
  receivers: [],
});

const methodSelect = () =>
  screen.getByRole("option", { name: "sparrowpy" }).closest("select") as HTMLSelectElement;
const option = (name: string) => screen.getByRole("option", { name }) as HTMLOptionElement;
// longer than the 200 ms delay of the old save on load (choras-org/CHORAS#89)
const waitPastOldSaveDelay = () => act(() => new Promise((r) => setTimeout(r, 300)));
const hint = () => screen.queryByText(/not compatible with the current geometry/);

beforeEach(() => {
  mocks.simulations = [simulation(1, "DE"), simulation(2, "misuka")];
  mocks.model = { id: 1, repairStatus: "Accepted" };
  mocks.repairedCompatibilityData = null;
  mocks.updateSimulation.mockReset();
  mocks.updateSimulation.mockImplementation(({ body }) => ({
    unwrap: () => Promise.resolve({ id: 1, ...body }),
  }));
  mocks.initializeSettings.mockReset();
});

afterEach(cleanup);

test("opening a DE simulation does not save its method or settings", async () => {
  render(<SimulationPicker modelId={1} simulationId={1} />);
  await waitPastOldSaveDelay();
  expect(methodSelect().value).toBe("DE");
  expect(mocks.updateSimulation).not.toHaveBeenCalled();
  expect(mocks.initializeSettings).not.toHaveBeenCalled();
});

test("opening a misuka simulation does not save its method or settings", async () => {
  render(<SimulationPicker modelId={1} simulationId={2} />);
  await waitPastOldSaveDelay();
  expect(methodSelect().value).toBe("misuka");
  expect(mocks.updateSimulation).not.toHaveBeenCalled();
  expect(mocks.initializeSettings).not.toHaveBeenCalled();
});

test("switching to another simulation does not save", async () => {
  const { rerender } = render(<SimulationPicker modelId={1} simulationId={1} />);
  await waitPastOldSaveDelay();
  rerender(<SimulationPicker modelId={1} simulationId={2} />);
  await waitPastOldSaveDelay();
  expect(methodSelect().value).toBe("misuka");
  expect(mocks.updateSimulation).not.toHaveBeenCalled();
});

test("the first method change after opening a DE simulation is saved", async () => {
  render(<SimulationPicker modelId={1} simulationId={1} />);
  await waitPastOldSaveDelay();
  await act(async () => {
    fireEvent.change(methodSelect(), { target: { value: "sparrowpy" } });
  });
  expect(methodSelect().value).toBe("sparrowpy");
  expect(mocks.updateSimulation).toHaveBeenCalledTimes(1);
  expect(mocks.updateSimulation.mock.calls[0][0].body.simulationMethod).toBe("sparrowpy");
  expect(mocks.initializeSettings).toHaveBeenCalledTimes(1);
  expect(mocks.initializeSettings.mock.calls[0][1]).toBe("sparrowpy");
});

test("only the last of two quick method changes initializes settings", async () => {
  const pending: Array<() => void> = [];
  mocks.updateSimulation.mockImplementation(({ body }) => ({
    unwrap: () => new Promise((resolve) => pending.push(() => resolve({ id: 1, ...body }))),
  }));
  render(<SimulationPicker modelId={1} simulationId={1} />);
  fireEvent.change(methodSelect(), { target: { value: "misuka" } });
  fireEvent.change(methodSelect(), { target: { value: "sparrowpy" } });
  await act(async () => pending[0]());
  await act(async () => pending[1]());
  expect(mocks.updateSimulation).toHaveBeenCalledTimes(2);
  expect(mocks.initializeSettings).toHaveBeenCalledTimes(1);
  expect(mocks.initializeSettings.mock.calls[0][1]).toBe("sparrowpy");
});

test("an incompatible stored method stays selected and shows a hint", async () => {
  mocks.repairedCompatibilityData = [{ simulationType: "misuka", compatible: "incompatible" }];
  render(<SimulationPicker modelId={1} simulationId={2} />);
  await waitPastOldSaveDelay();
  expect(methodSelect().value).toBe("misuka");
  expect(hint()).not.toBeNull();
  expect(mocks.updateSimulation).not.toHaveBeenCalled();
});

test("an incompatible method is disabled in the dropdown", () => {
  mocks.repairedCompatibilityData = [{ simulationType: "misuka", compatible: "incompatible" }];
  render(<SimulationPicker modelId={1} simulationId={2} />);
  expect(option("Pyroomacoustics").disabled).toBe(true);
  expect(option("sparrowpy").disabled).toBe(false);
});

test("choosing a compatible method saves it and removes the hint", async () => {
  mocks.repairedCompatibilityData = [{ simulationType: "misuka", compatible: "incompatible" }];
  render(<SimulationPicker modelId={1} simulationId={2} />);
  await act(async () => {
    fireEvent.change(methodSelect(), { target: { value: "sparrowpy" } });
  });
  expect(hint()).toBeNull();
  expect(mocks.updateSimulation.mock.calls[0][0].body.simulationMethod).toBe("sparrowpy");
});

test("no hint is shown while the repair is pending", () => {
  mocks.model = { id: 1, repairStatus: "Pending" };
  render(<SimulationPicker modelId={1} simulationId={2} />);
  expect(hint()).toBeNull();
});
