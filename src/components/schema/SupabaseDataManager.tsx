import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import { supabase } from "@/lib/supabase";
import {
  Database,
  Edit,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface SupabaseDataManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SupabaseDataManager: React.FC<SupabaseDataManagerProps> = ({
  isOpen = true,
  onClose = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("users");
  const [tables, setTables] = useState<string[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [newRow, setNewRow] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch available tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public");

        if (error) throw error;

        if (data) {
          const tableNames = data.map((t) => t.table_name);
          setTables(tableNames);
          // Set first table as active if none selected
          if (tableNames.length > 0 && !tableNames.includes(activeTab)) {
            setActiveTab(tableNames[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching tables:", err);
        setError(
          "Failed to fetch tables. Please check your Supabase connection.",
        );
      }
    };

    fetchTables();
  }, []);

  // Fetch table columns when active tab changes
  useEffect(() => {
    const fetchColumns = async () => {
      if (!activeTab) return;

      try {
        const { data, error } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type, is_nullable, column_default")
          .eq("table_schema", "public")
          .eq("table_name", activeTab);

        if (error) throw error;

        if (data) {
          setColumns(data);
        }
      } catch (err) {
        console.error(`Error fetching columns for ${activeTab}:`, err);
        setError(`Failed to fetch columns for ${activeTab}.`);
      }
    };

    fetchColumns();
    fetchTableData();
  }, [activeTab]);

  // Fetch table data
  const fetchTableData = async () => {
    if (!activeTab) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from(activeTab)
        .select("*")
        .limit(100);

      if (error) throw error;

      setTableData(data || []);
    } catch (err: any) {
      console.error(`Error fetching data from ${activeTab}:`, err);
      setError(`Failed to fetch data: ${err.message}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new row
  const handleAddRow = async () => {
    if (!newRow || !activeTab) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase
        .from(activeTab)
        .insert([newRow])
        .select();

      if (error) throw error;

      setSuccess("Row added successfully!");
      setShowAddForm(false);
      setNewRow(null);
      fetchTableData();
    } catch (err: any) {
      console.error(`Error adding row to ${activeTab}:`, err);
      setError(`Failed to add row: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update row
  const handleUpdateRow = async () => {
    if (!editingRow || !activeTab) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get primary key column (assuming it's id)
      const primaryKey = "id";
      const primaryKeyValue = editingRow[primaryKey];

      if (!primaryKeyValue) {
        throw new Error("Primary key value not found");
      }

      const { data, error } = await supabase
        .from(activeTab)
        .update(editingRow)
        .eq(primaryKey, primaryKeyValue)
        .select();

      if (error) throw error;

      setSuccess("Row updated successfully!");
      setEditingRow(null);
      fetchTableData();
    } catch (err: any) {
      console.error(`Error updating row in ${activeTab}:`, err);
      setError(`Failed to update row: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete row
  const handleDeleteRow = async (row: any) => {
    if (!activeTab) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get primary key column (assuming it's id)
      const primaryKey = "id";
      const primaryKeyValue = row[primaryKey];

      if (!primaryKeyValue) {
        throw new Error("Primary key value not found");
      }

      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq(primaryKey, primaryKeyValue);

      if (error) throw error;

      setSuccess("Row deleted successfully!");
      fetchTableData();
    } catch (err: any) {
      console.error(`Error deleting row from ${activeTab}:`, err);
      setError(`Failed to delete row: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize new row with empty values for all columns
  const initializeNewRow = () => {
    const emptyRow: any = {};
    columns.forEach((col) => {
      emptyRow[col.column_name] = null;
    });
    setNewRow(emptyRow);
    setShowAddForm(true);
  };

  // Handle input change for editing
  const handleEditInputChange = (columnName: string, value: any) => {
    setEditingRow((prev) => ({
      ...prev,
      [columnName]: value,
    }));
  };

  // Handle input change for new row
  const handleNewRowInputChange = (columnName: string, value: any) => {
    setNewRow((prev) => ({
      ...prev,
      [columnName]: value,
    }));
  };

  // Format value for display
  const formatValue = (value: any) => {
    if (value === null) return "null";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Render form for editing or adding
  const renderForm = (isEditing: boolean) => {
    const rowData = isEditing ? editingRow : newRow;
    const handleChange = isEditing
      ? handleEditInputChange
      : handleNewRowInputChange;

    if (!rowData) return null;

    return (
      <div className="space-y-4 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-medium">
          {isEditing ? "Edit Row" : "Add New Row"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {columns.map((column) => {
            // Skip auto-generated columns for new rows
            if (
              !isEditing &&
              (column.column_default?.includes("uuid_generate_v4()") ||
                column.column_name === "created_at" ||
                column.column_name === "updated_at")
            ) {
              return null;
            }

            return (
              <div key={column.column_name} className="space-y-2">
                <Label htmlFor={`${column.column_name}-input`}>
                  {column.column_name}
                  <span className="text-xs text-gray-500 ml-1">
                    ({column.data_type})
                  </span>
                  {column.is_nullable === "NO" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Input
                  id={`${column.column_name}-input`}
                  value={rowData[column.column_name] || ""}
                  onChange={(e) =>
                    handleChange(column.column_name, e.target.value)
                  }
                  placeholder={
                    column.is_nullable === "YES" ? "Optional" : "Required"
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() =>
              isEditing ? setEditingRow(null) : setShowAddForm(false)
            }
          >
            Cancel
          </Button>
          <Button
            onClick={isEditing ? handleUpdateRow : handleAddRow}
            disabled={loading}
          >
            {loading ? "Processing..." : isEditing ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Supabase Data Manager
          </DialogTitle>
          <p className="text-gray-500 mt-1">
            Manage data in your Supabase tables
          </p>
        </DialogHeader>

        {/* Notifications */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex h-[calc(90vh-200px)] overflow-hidden">
          {/* Table selector sidebar */}
          <div className="w-48 border-r pr-4 overflow-y-auto">
            <h3 className="font-medium mb-2">Tables</h3>
            <div className="space-y-1">
              {tables.length === 0 ? (
                <p className="text-sm text-gray-500">No tables found</p>
              ) : (
                tables.map((table) => (
                  <button
                    key={table}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeTab === table ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"}`}
                    onClick={() => setActiveTab(table)}
                  >
                    {table}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 pl-4 overflow-hidden flex flex-col">
            {/* Table actions */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                {activeTab}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTableData}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={initializeNewRow}
                  disabled={loading || showAddForm}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>
            </div>

            {/* Add form */}
            {showAddForm && renderForm(false)}

            {/* Edit form */}
            {editingRow && renderForm(true)}

            {/* Table data */}
            <div className="flex-1 overflow-hidden border rounded-md">
              <ScrollArea className="h-full">
                {tableData.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {loading
                      ? "Loading data..."
                      : "No data found in this table"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((column) => (
                          <TableHead key={column.column_name}>
                            {column.column_name}
                          </TableHead>
                        ))}
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {columns.map((column) => (
                            <TableCell
                              key={column.column_name}
                              className="max-w-[200px] truncate"
                            >
                              {formatValue(row[column.column_name])}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingRow(row)}
                                className="h-8 w-8 text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRow(row)}
                                className="h-8 w-8 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupabaseDataManager;
