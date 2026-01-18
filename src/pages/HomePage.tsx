import { ProjectForm } from "@/components/features/ProjectForm";
import { ProjectCard } from "@/components/features/ProjectCard";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AppLayout } from "@/components/ui/app-layout";
import { Loading } from "@/components/ui/loading";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useGetProjectsQuery } from "@/store/projectApi";
import { selectProjectsByActiveGroup } from "@/store/projectSelector";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from "lucide-react";
import plusIcon from "@/assets/plus-icon.png";
import type React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router";
import { WelcomeSidebar } from "@/components/features/WelcomeSidebar";
import { GroupPicker } from "@/components/features/GroupPicker";
import { DeleteGroup } from "@/components/features/DeleteGroup";
import { syncGroupsFromProjects } from "@/store/projectSlice";
import { useEffect, useState } from "react";
import { SortPicker } from "@/components/features/SortPicker";
import type { GroupProject, Project } from "@/types/project";
import { cn } from "@/libs/style";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditGroup } from "@/components/features/EditGroup";

export function HomePage() {
  const { data: projects, isLoading, error } = useGetProjectsQuery();
  const groupProjects = useSelector(selectProjectsByActiveGroup);
  const dispatch = useDispatch();
  const [sort, setSort] = useState<string>("ASC");
  const [groupProjectList, setGroupProjectList] = useState<GroupProject[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Reusable sorting function
  const sortProjects = (projects: Project[], sortOption: string) => {
    const sortedProjects = [...projects];

    switch (sortOption) {
      case "ASC":
        return sortedProjects.sort((a, b) => a.name.localeCompare(b.name));
      case "DESC":
        return sortedProjects.sort((a, b) => b.name.localeCompare(a.name));
      case "NEWEST_FIRST":
        return sortedProjects.sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          // If timestamps are the same, sort by ID (higher ID = newer)
          return timeDiff !== 0 ? timeDiff : b.id - a.id;
        });
      case "LAST_MODIFIED":
        return sortedProjects.sort((a, b) => {
          const timeDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          // If timestamps are the same, sort by ID (higher ID = newer)
          return timeDiff !== 0 ? timeDiff : b.id - a.id;
        });
      default:
        return sortedProjects.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  // Sync groups from projects to Redux state when projects load
  useEffect(() => {
    if (projects) {
      const groupsFromProjects = projects.filter((p) => p.group).map((p) => p.group as string);

      if (groupsFromProjects.length > 0) {
        dispatch(syncGroupsFromProjects(groupsFromProjects));
      }
    }
  }, [projects, dispatch]);

  useEffect(() => {
    if (groupProjects) {
      const sortedGroupProjects = groupProjects.map((groupProject) => ({
        ...groupProject,
        projects: sortProjects(groupProject.projects, sort),
      }));

      setGroupProjectList(sortedGroupProjects);
    }
  }, [groupProjects, sort]);

  useEffect(() => {
    const savedSortOption = localStorage.getItem("projectSortOption");
    if (savedSortOption) {
      setSort(savedSortOption);
    }

    const savedCollapsedGroups = localStorage.getItem("collapsedGroups");
    if (savedCollapsedGroups) {
      try {
        const collapsedArray = JSON.parse(savedCollapsedGroups);
        setCollapsedGroups(new Set(collapsedArray));
      } catch (error) {
        console.error("Failed to parse collapsed groups from localStorage:", error);
      }
    }
  }, []);

  let content: React.ReactNode = null;

  const handleSetSort = (value: string) => {
    setSort(value);
    localStorage.setItem("projectSortOption", value);
  };

  const toggleGroupCollapse = (groupName: string) => {
    const newCollapsedGroups = new Set(collapsedGroups);
    if (newCollapsedGroups.has(groupName)) {
      newCollapsedGroups.delete(groupName);
    } else {
      newCollapsedGroups.add(groupName);
    }
    setCollapsedGroups(newCollapsedGroups);
    localStorage.setItem("collapsedGroups", JSON.stringify(Array.from(newCollapsedGroups)));
  };

  const isGroupCollapsed = (groupName: string) => {
    return collapsedGroups.has(groupName);
  };

  if (error) {
    content = (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircleIcon />
          <AlertTitle>Error loading projects</AlertTitle>
        </Alert>
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loading message="Loading projects..." />
      </div>
    );
  } else if (!groupProjects || groupProjects.length === 0) {
    content = (
      <div className="p-6 h-container relative">
        <div className="fixed right-8 top-20">
          <SortPicker onValueChange={(value) => setSort(value)} value={sort} />
          <div className="mr-4"></div>
          <GroupPicker />
        </div>

        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-inter font-light text-choras-dark">No projects found</h2>
            <p className="text-black/75">Create your first project to get started</p>
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="p-6 relative">
        <div className="flex fixed right-8 top-20">
          <SortPicker onValueChange={handleSetSort} value={sort} />
          <div className="mr-4"></div>
          <GroupPicker />
        </div>
        {groupProjectList.map((groupProject) => (
          <Collapsible
            key={groupProject.group}
            open={!isGroupCollapsed(groupProject.group)}
            onOpenChange={() => toggleGroupCollapse(groupProject.group)}
          >
            <div className="flex items-center pb-4">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                {isGroupCollapsed(groupProject.group) ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
                <h1 className="inline text-lg font-inter font-light border-b text-choras-dark border-b-choras-dark">
                  {groupProject.group === "NONE" ? "No group" : groupProject.group}
                </h1>
              </CollapsibleTrigger>
              {groupProject.group !== "NONE" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-2 p-1 hover:bg-gray-200 rounded-md transition-colors">
                      <EllipsisVerticalIcon className="h-4 w-4 text-choras-dark" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border border-gray-200 rounded-md shadow-lg p-1">
                    <EditGroup
                      currentGroupName={groupProject.group}
                      projectIds={groupProject.projects.map((p) => p.id)}
                      trigger={
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-1"
                        >
                          Edit name
                        </DropdownMenuItem>
                      }
                    />
                    <DeleteGroup
                      projectsCount={groupProject.projects.length}
                      group={groupProject.group}
                      projectIds={groupProject.projects.map((p) => p.id)}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CollapsibleContent>
              <div
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-b border-b-black/25 pb-6",
                  {
                    "mb-6": !isGroupCollapsed(groupProject.group),
                  },
                )}
              >
                {groupProject.projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`}>
                    <ProjectCard project={project} />
                  </Link>
                ))}

                <ProjectForm
                  defaultValues={{
                    name: "",
                    description: "",
                    group: groupProject.group === "NONE" ? "" : groupProject.group,
                  }}
                  trigger={
                    <div className="min-h-[192px] border border-transparent bg-gradient-to-r from-choras-primary from-50% to-choras-secondary bg-clip-border p-0.5 rounded-xl">
                      <div className="bg-[#e7e7e7] w-full min-h-[190px] py-6 rounded-lg h-full flex-1 flex items-center justify-center">
                        <img src={plusIcon} alt="Plus" className="w-16 h-16" />
                      </div>
                    </div>
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    );
  }

  return (
    <AppLayout title="Projects" sidebar={<WelcomeSidebar />}>
      {content}
    </AppLayout>
  );
}
