import { Provider as ReduxProvider } from "react-redux";
import { Navigate, BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { HomePage } from "./pages/HomePage";
import { EditorPage } from "./pages/EditorPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ResultPage } from "./pages/ResultPage";
import { store } from "./store";
import { SimulationRunnerProvider } from "./contexts/SimulationRunnerContext";

function App() {
  return (
    <ReduxProvider store={store}>
      <SimulationRunnerProvider>
        <Toaster position="top-center" richColors duration={5000} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/editor/:modelId/:simulationId?" element={<EditorPage />} />
            <Route path="/editor/:modelId/:simulationId/results" element={<ResultPage />} />

            {/* Not Found */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SimulationRunnerProvider>
    </ReduxProvider>
  );
}

export default App;
