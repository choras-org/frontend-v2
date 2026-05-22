import { ModelCard } from "@/components/features/ModelCard";
import { UploadModel } from "@/components/features/UploadModel";
import { WelcomeSidebar } from "@/components/features/WelcomeSidebar";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AppLayout } from "@/components/ui/app-layout";
import { Loading } from "@/components/ui/loading";
import { projectApi, useGetProjectQuery } from "@/store/projectApi";
import { AlertCircleIcon, ChevronLeftIcon } from "lucide-react";
import type React from "react";
import { useParams, Link } from "react-router";
import modelImg from "@/assets/model.png";
import { formatDateLong } from "@/helpers/datetime";
import uploadIcon from "@/assets/upload-icon.png";
import { SortPicker } from "@/components/features/SortPicker";
import { useEffect, useState } from "react";
import type { Model } from "@/types/model";
import { useDispatch } from "react-redux";
import { removeAllReceivers, removeAllSources } from "@/store/sourceReceiverSlice";

export function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: project, isLoading, error, refetch } = useGetProjectQuery(id);
  const [sort, setSort] = useState<string>("ASC");
  const [models, setModels] = useState<Model[]>();
  const dispatch = useDispatch();

  // Reusable sorting function for models
  const sortModels = (models: Model[], sortOption: string) => {
    const sortedModels = [...models];

    switch (sortOption) {
      case "ASC":
        return sortedModels.sort((a, b) => a.name.localeCompare(b.name));
      case "DESC":
        return sortedModels.sort((a, b) => b.name.localeCompare(a.name));
      case "NEWEST_FIRST":
        return sortedModels.sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          // If timestamps are the same, sort by ID (higher ID = newer)
          return timeDiff !== 0 ? timeDiff : b.id - a.id;
        });
      case "LAST_MODIFIED":
        return sortedModels.sort((a, b) => {
          const timeDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          // If timestamps are the same, sort by ID (higher ID = newer)
          return timeDiff !== 0 ? timeDiff : b.id - a.id;
        });
      default:
        return sortedModels.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  let content: React.ReactNode = null;

  useEffect(() => {
    if (project?.models) {
      const sortedModels = sortModels(project.models, sort);
      setModels(sortedModels);
    }
  }, [project, sort]);

  useEffect(() => {
    const savedSortOption = localStorage.getItem("modelSortOption");
    if (savedSortOption) {
      setSort(savedSortOption);
    }
  }, []);

  // cleanup sources and receiver when changing model
  useEffect(() => {
    if (id) {
      dispatch(removeAllSources());
      dispatch(removeAllReceivers());
    }
  }, [id, dispatch]);

  const handleSetSort = (value: string) => {
    setSort(value);
    localStorage.setItem("modelSortOption", value);
  };

  if (error) {
    content = (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircleIcon />
          <AlertTitle>Error loading project</AlertTitle>
        </Alert>
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loading message="Loading project..." />
      </div>
    );
  } else if (!project) {
    content = <div>No project found</div>;
  } else {
    content = (
      <div className="p-6 space-y-8">
        {/* Back to projects link and Sort Picker */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="flex font-inter font-bold text-sm items-center gap-2 text-black/75"
          >
            <ChevronLeftIcon className="h-4 w-4 text-black/75" />
            back to projects
          </Link>
          <SortPicker onValueChange={handleSetSort} value={sort} />
        </div>

        {/* Project Info Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 font-inter">
          {/* Stack of model images - Pindah ke atas untuk mobile */}
          <div className="relative w-48 h-32 flex-shrink-0 lg:order-2 self-start ml-6 lg:ml-0">
            {Array.from({ length: Math.min(project.models?.length, 3) }, (_, index) => (
              <img
                key={index}
                className="absolute w-32 h-24 rounded-lg bg-white/80"
                src={modelImg}
                alt="Model Illustration"
                style={{
                  transform: `rotate(${index * 15 - 5}deg) translate(${index * (project.models.length > 2 ? 15 : 30) - 30}px, ${index * -2}px)`,
                  boxShadow: `0 ${2 + index * 2}px ${4 + index * 2}px rgba(0, 0, 0, 0.2), 0 ${1 + index}px ${2 + index}px rgba(0, 0, 0, 0.1)`,
                }}
              />
            ))}
          </div>

          <div className="space-y-6 lg:order-1">
            <h1 className="text-2xl text-choras-secondary font-inter font-bold mb-2">
              {project.name}
            </h1>
            <p className="text-xs text-black/50">
              {project.description || "Project description not available"}
            </p>

            <div className="space-y-4 text-sm">
              <div className="text-black/80">
                <span className="font-bold">Group:</span> <span>{project.group}</span>
              </div>
              <div className="text-black/80">
                <span className="font-bold">Created:</span>{" "}
                <span>{formatDateLong(project.createdAt)}</span>
              </div>
              <div className="text-black/80">
                <span className="font-bold">Updated:</span>{" "}
                <span>{formatDateLong(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-black/25" />

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models &&
            models.length > 0 &&
            models.map((model) => (
              <Link key={model.id} to={`/editor/${model.id}`}>
                <ModelCard key={model.id} model={model} />
              </Link>
            ))}

          {/* Upload Model Card - just visual representation */}
          <UploadModel
            projectId={id}
            onSuccess={() => {
              refetch();
              dispatch(projectApi.util.invalidateTags([{ type: "Projects" }]));
            }}
            trigger={
              <div className="min-h-[192px] border border-transparent bg-gradient-to-r from-choras-primary from-50% to-choras-secondary bg-clip-border p-0.5 rounded-lg">
                <div className="bg-[#e7e7e7] min-h-[190px] py-6 rounded-lg h-full flex items-center justify-center">
                  <div className="flex flex-col items-center text-choras-secondary">
                    <img src={uploadIcon} alt="Upload Icon" className="h-16 w-16" />
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <AppLayout title={"Models"} sidebar={<WelcomeSidebar />}>
      {content}
    </AppLayout>
  );
}
