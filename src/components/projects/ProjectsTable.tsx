import React, { useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  description: string;
  databaseType: string;
  schemasCount: number;
  lastModified: string;
  status: "active" | "inactive" | "draft";
}

interface ProjectsTableProps {
  projects?: Project[];
  onViewProject?: (id: string) => void;
  onEditProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onCreateProject?: () => void;
}

const ProjectsTable = ({
  projects = [
    {
      id: "1",
      name: "E-commerce Database",
      description: "Product catalog and order management system",
      databaseType: "PostgreSQL",
      schemasCount: 5,
      lastModified: "2023-06-15T10:30:00Z",
      status: "active",
    },
    {
      id: "2",
      name: "User Authentication",
      description: "User profiles and authentication system",
      databaseType: "MongoDB",
      schemasCount: 3,
      lastModified: "2023-06-10T14:45:00Z",
      status: "active",
    },
    {
      id: "3",
      name: "Content Management",
      description: "Blog and media content storage",
      databaseType: "MySQL",
      schemasCount: 7,
      lastModified: "2023-06-05T09:15:00Z",
      status: "inactive",
    },
    {
      id: "4",
      name: "Analytics Platform",
      description: "Data warehouse for business metrics",
      databaseType: "BigQuery",
      schemasCount: 12,
      lastModified: "2023-05-28T16:20:00Z",
      status: "active",
    },
    {
      id: "5",
      name: "Inventory System",
      description: "Stock management and tracking",
      databaseType: "PostgreSQL",
      schemasCount: 4,
      lastModified: "2023-05-20T11:10:00Z",
      status: "draft",
    },
  ],
  onViewProject = () => {},
  onEditProject = () => {},
  onDeleteProject = () => {},
  onCreateProject = () => {},
}: ProjectsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Project>("lastModified");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter projects based on search query
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.databaseType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort projects based on column and direction
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (sortColumn === "lastModified") {
      return sortDirection === "asc"
        ? new Date(aValue as string).getTime() -
            new Date(bValue as string).getTime()
        : new Date(bValue as string).getTime() -
            new Date(aValue as string).getTime();
    }

    if (sortColumn === "schemasCount") {
      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }

    // String comparison for other columns
    return sortDirection === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const handleSort = (column: keyof Project) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button
            onClick={onCreateProject}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Project Name
                  {sortColumn === "name" && (
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("databaseType")}
              >
                <div className="flex items-center">
                  Database Type
                  {sortColumn === "databaseType" && (
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("schemasCount")}
              >
                <div className="flex items-center justify-end">
                  Schemas
                  {sortColumn === "schemasCount" && (
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("lastModified")}
              >
                <div className="flex items-center">
                  Last Modified
                  {sortColumn === "lastModified" && (
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {sortColumn === "status" && (
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No projects found. Create a new project to get started.
                </TableCell>
              </TableRow>
            ) : (
              sortedProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.description}
                  </TableCell>
                  <TableCell>{project.databaseType}</TableCell>
                  <TableCell className="text-right">
                    {project.schemasCount}
                  </TableCell>
                  <TableCell>{formatDate(project.lastModified)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        project.status,
                      )}`}
                    >
                      {project.status.charAt(0).toUpperCase() +
                        project.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewProject(project.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditProject(project.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteProject(project.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectsTable;
