import React, { useState } from "react";
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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  ChevronDown,
  Plus,
  LayoutGrid,
  List,
  MoreVertical,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  sex: "Male" | "Female";
  condition?: string;
  progress: number;
  address: string;
  phone: string;
  avatar?: string;
}

interface PatientsListProps {
  patients?: Patient[];
  onAddPatient?: () => void;
}

const PatientsList = ({
  patients = [
    {
      id: "000001",
      name: "Oleksii Novikov",
      dateOfBirth: "12.08.1985",
      sex: "Male",
      progress: 28,
      address: "Lva Bogomolytsya St.",
      phone: "+3 805 123 45 67",
    },
    {
      id: "000002",
      name: "Svitlana Semerenko",
      dateOfBirth: "26.02.1969",
      sex: "Female",
      condition: "Diabetes",
      progress: 60,
      address: "Lva Varshavska St.",
      phone: "+3 806 234 56 78",
    },
    {
      id: "000003",
      name: "Taras Potursi",
      dateOfBirth: "22.05.1987",
      sex: "Male",
      progress: 25,
      address: "Lva Doroshenko St.",
      phone: "+3 806 345 67 89",
    },
    {
      id: "000004",
      name: "Iryna Ivanenko",
      dateOfBirth: "28.11.1989",
      sex: "Female",
      progress: 53,
      address: "Lva Konovaltsya St.",
      phone: "+3 809 456 78 90",
    },
    {
      id: "000005",
      name: "Diana Besarab",
      dateOfBirth: "17.03.1984",
      sex: "Female",
      progress: 30,
      address: "Lva Shchyretska St.",
      phone: "+3 806 567 89 01",
    },
    {
      id: "000006",
      name: "Maria Zakharova",
      dateOfBirth: "03.01.1993",
      sex: "Female",
      progress: 85,
      address: "Lva Lysenko St.",
      phone: "+3 809 291 45 25",
    },
    {
      id: "000007",
      name: "Roman Gerych",
      dateOfBirth: "17.05.1990",
      sex: "Male",
      progress: 55,
      address: "Lva Zelena St.",
      phone: "+3 806 698 38 22",
    },
    {
      id: "000008",
      name: "Natalia Uhankina",
      dateOfBirth: "21.06.1989",
      sex: "Female",
      progress: 75,
      address: "Lva Dashkevycha St.",
      phone: "+3 806 296 19 67",
    },
    {
      id: "000009",
      name: "Roman Svechuk",
      dateOfBirth: "14.07.1991",
      sex: "Male",
      condition: "HIV",
      progress: 80,
      address: "Lva Bandery St.",
      phone: "+3 809 298 23 29",
    },
    {
      id: "000010",
      name: "Oleksandra Pervak",
      dateOfBirth: "19.03.1994",
      sex: "Female",
      condition: "Bronchitis",
      progress: 15,
      address: "Lva Zamkova St.",
      phone: "+3 809 546 35 78",
    },
    {
      id: "000011",
      name: "Heorhiy Bohdan",
      dateOfBirth: "09.09.1986",
      sex: "Male",
      condition: "Flu",
      progress: 45,
      address: "Lva Bogomolytsya St.",
      phone: "+3 809 546 35 78",
    },
    {
      id: "000012",
      name: "Solomiya Krutsko",
      dateOfBirth: "03.12.1978",
      sex: "Female",
      condition: "Heart attack",
      progress: 25,
      address: "Lva Tekhnichna St.",
      phone: "+3 806 296 19 67",
    },
    {
      id: "000013",
      name: "Yarema Medynskiy",
      dateOfBirth: "12.04.1995",
      sex: "Male",
      condition: "Food poisoning",
      progress: 95,
      address: "Lva Proxivny St.",
      phone: "+3 806 284 31 55",
    },
  ],
  onAddPatient = () => {},
}: PatientsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "id",
    "name",
    "dateOfBirth",
    "sex",
    "condition",
    "progress",
    "address",
    "phone",
  ]);

  // Filter patients based on search query
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.includes(searchQuery) ||
      (patient.condition?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ),
  );

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId],
    );
  };

  const toggleAllPatients = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map((patient) => patient.id));
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column],
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Patients</h2>
          <div className="text-sm text-gray-500">
            {filteredPatients.length} of {patients.length} patients
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Find a patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="font-medium mb-2">Filter by column</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-id"
                        checked={visibleColumns.includes("id")}
                        onCheckedChange={() => toggleColumn("id")}
                      />
                      <label
                        htmlFor="column-id"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        ID
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-name"
                        checked={visibleColumns.includes("name")}
                        onCheckedChange={() => toggleColumn("name")}
                      />
                      <label
                        htmlFor="column-name"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Name
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-dob"
                        checked={visibleColumns.includes("dateOfBirth")}
                        onCheckedChange={() => toggleColumn("dateOfBirth")}
                      />
                      <label
                        htmlFor="column-dob"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Date of birth
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-sex"
                        checked={visibleColumns.includes("sex")}
                        onCheckedChange={() => toggleColumn("sex")}
                      />
                      <label
                        htmlFor="column-sex"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Sex
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-condition"
                        checked={visibleColumns.includes("condition")}
                        onCheckedChange={() => toggleColumn("condition")}
                      />
                      <label
                        htmlFor="column-condition"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Condition
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-progress"
                        checked={visibleColumns.includes("progress")}
                        onCheckedChange={() => toggleColumn("progress")}
                      />
                      <label
                        htmlFor="column-progress"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Treatment process
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-address"
                        checked={visibleColumns.includes("address")}
                        onCheckedChange={() => toggleColumn("address")}
                      />
                      <label
                        htmlFor="column-address"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Address
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="column-phone"
                        checked={visibleColumns.includes("phone")}
                        onCheckedChange={() => toggleColumn("phone")}
                      />
                      <label
                        htmlFor="column-phone"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Phone
                      </label>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleColumns([])}
                  >
                    Clear all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVisibleColumns([
                        "id",
                        "name",
                        "dateOfBirth",
                        "sex",
                        "condition",
                        "progress",
                        "address",
                        "phone",
                      ])
                    }
                  >
                    Show all
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={onAddPatient}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add patient</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-2 flex items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Sort by:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 h-8"
                >
                  <span>
                    {sortBy === "name"
                      ? "Name"
                      : sortBy === "dateOfBirth"
                        ? "Date of birth"
                        : sortBy === "progress"
                          ? "Treatment process"
                          : "Name"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("dateOfBirth")}>
                  Date of birth
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("progress")}>
                  Treatment process
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedPatients.length === filteredPatients.length &&
                      filteredPatients.length > 0
                    }
                    onCheckedChange={toggleAllPatients}
                    aria-label="Select all patients"
                  />
                </TableHead>
                {visibleColumns.includes("id") && (
                  <TableHead className="w-24">ID</TableHead>
                )}
                {visibleColumns.includes("name") && <TableHead>Name</TableHead>}
                {visibleColumns.includes("dateOfBirth") && (
                  <TableHead>Date of birth</TableHead>
                )}
                {visibleColumns.includes("sex") && <TableHead>Sex</TableHead>}
                {visibleColumns.includes("condition") && (
                  <TableHead>Condition</TableHead>
                )}
                {visibleColumns.includes("progress") && (
                  <TableHead>Treatment process</TableHead>
                )}
                {visibleColumns.includes("address") && (
                  <TableHead>Address</TableHead>
                )}
                {visibleColumns.includes("phone") && (
                  <TableHead>Phone</TableHead>
                )}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 2}
                    className="h-24 text-center"
                  >
                    No patients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPatients.includes(patient.id)}
                        onCheckedChange={() =>
                          togglePatientSelection(patient.id)
                        }
                        aria-label={`Select ${patient.name}`}
                      />
                    </TableCell>
                    {visibleColumns.includes("id") && (
                      <TableCell className="font-medium">
                        {patient.id}
                      </TableCell>
                    )}
                    {visibleColumns.includes("name") && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {patient.avatar ? (
                              <AvatarImage
                                src={patient.avatar}
                                alt={patient.name}
                              />
                            ) : (
                              <AvatarFallback>
                                {getInitials(patient.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>{patient.name}</span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes("dateOfBirth") && (
                      <TableCell>{patient.dateOfBirth}</TableCell>
                    )}
                    {visibleColumns.includes("sex") && (
                      <TableCell>{patient.sex}</TableCell>
                    )}
                    {visibleColumns.includes("condition") && (
                      <TableCell>
                        {patient.condition ? (
                          <Badge
                            variant="outline"
                            className={`${patient.condition === "HIV" || patient.condition === "Heart attack" ? "border-red-200 bg-red-50 text-red-700" : patient.condition === "Flu" || patient.condition === "Bronchitis" ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}
                          >
                            {patient.condition}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("progress") && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(patient.progress)}`}
                              style={{ width: `${patient.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {patient.progress}%
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes("address") && (
                      <TableCell>{patient.address}</TableCell>
                    )}
                    {visibleColumns.includes("phone") && (
                      <TableCell>{patient.phone}</TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Edit patient</DropdownMenuItem>
                          <DropdownMenuItem>Medical history</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Delete patient
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
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No patients found.
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {patient.avatar ? (
                        <AvatarImage src={patient.avatar} alt={patient.name} />
                      ) : (
                        <AvatarFallback>
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{patient.name}</h3>
                      <p className="text-sm text-gray-500">{patient.id}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Edit patient</DropdownMenuItem>
                      <DropdownMenuItem>Medical history</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Delete patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Date of birth:
                    </span>
                    <span className="text-sm">{patient.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Sex:</span>
                    <span className="text-sm">{patient.sex}</span>
                  </div>
                  {patient.condition && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Condition:</span>
                      <Badge
                        variant="outline"
                        className={`${patient.condition === "HIV" || patient.condition === "Heart attack" ? "border-red-200 bg-red-50 text-red-700" : patient.condition === "Flu" || patient.condition === "Bronchitis" ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}
                      >
                        {patient.condition}
                      </Badge>
                    </div>
                  )}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">
                        Treatment progress:
                      </span>
                      <span className="text-sm">{patient.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(patient.progress)}`}
                        style={{ width: `${patient.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          100 000 patients <span className="mx-2">•</span> 1 of 1 500 pages
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <div className="flex items-center border rounded">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              1
            </Button>
          </div>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientsList;
