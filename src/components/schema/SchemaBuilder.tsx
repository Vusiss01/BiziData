import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, Database } from "lucide-react";
import { getSupabaseClient } from "@/hooks/useAuth";

interface Field {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  description: string;
}

interface SchemaBuilderProps {
  onSave?: (schema: any) => void;
  initialSchema?: {
    name: string;
    description: string;
    fields: Field[];
    relationships: Relationship[];
  };
}

const SchemaBuilder: React.FC<SchemaBuilderProps> = ({
  onSave,
  initialSchema = {
    name: "",
    description: "",
    fields: [],
    relationships: [],
  },
}) => {
  const [schema, setSchema] = useState(initialSchema);
  const [newField, setNewField] = useState<Field>({
    name: "",
    type: "string",
    required: false,
    description: "",
  });
  const [newRelationship, setNewRelationship] = useState<Relationship>({
    from: schema.name,
    to: "",
    type: "one-to-many",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSchemaChange = (field: string, value: string) => {
    setSchema((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Update the "from" field in new relationships when schema name changes
    if (field === "name") {
      setNewRelationship((prev) => ({
        ...prev,
        from: value,
      }));
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setNewField((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRelationshipChange = (field: string, value: string) => {
    setNewRelationship((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addField = () => {
    if (!newField.name) return;

    setSchema((prev) => ({
      ...prev,
      fields: [...prev.fields, { ...newField }],
    }));

    setNewField({
      name: "",
      type: "string",
      required: false,
      description: "",
    });
  };

  const removeField = (index: number) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const addRelationship = () => {
    if (!newRelationship.to || !newRelationship.description) return;

    setSchema((prev) => ({
      ...prev,
      relationships: [...prev.relationships, { ...newRelationship }],
    }));

    setNewRelationship({
      from: schema.name,
      to: "",
      type: "one-to-many",
      description: "",
    });
  };

  const removeRelationship = (index: number) => {
    setSchema((prev) => ({
      ...prev,
      relationships: prev.relationships.filter((_, i) => i !== index),
    }));
  };

  const saveSchema = async () => {
    if (!schema.name) return;

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('schemas')
        .insert(schema);

      if (error) throw error;

      if (onSave) {
        onSave(schema);
      }
    } catch (error) {
      console.error("Error saving schema:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-orange-600" />
          Schema Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Schema Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schemaName">Schema Name</Label>
            <Input
              id="schemaName"
              placeholder="e.g. Restaurant, Order, MenuItem"
              value={schema.name}
              onChange={(e) => handleSchemaChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schemaDescription">Description</Label>
            <Textarea
              id="schemaDescription"
              placeholder="Describe what this schema represents"
              value={schema.description}
              onChange={(e) =>
                handleSchemaChange("description", e.target.value)
              }
            />
          </div>
        </div>

        {/* Fields Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Fields</h3>

          {/* Existing Fields */}
          {schema.fields.length > 0 && (
            <div className="mb-4 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">
                      Field Name
                    </th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">
                      Required
                    </th>
                    <th className="text-left py-2 px-3 font-medium">
                      Description
                    </th>
                    <th className="text-right py-2 px-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schema.fields.map((field, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-3">{field.name}</td>
                      <td className="py-2 px-3">{field.type}</td>
                      <td className="py-2 px-3">
                        {field.required ? "Yes" : "No"}
                      </td>
                      <td className="py-2 px-3">{field.description}</td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add New Field */}
          <div className="bg-gray-50 p-4 rounded-md border space-y-4">
            <h4 className="font-medium">Add New Field</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldName">Field Name</Label>
                <Input
                  id="fieldName"
                  placeholder="e.g. name, price, description"
                  value={newField.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldType">Type</Label>
                <Select
                  value={newField.type}
                  onValueChange={(value) => handleFieldChange("type", value)}
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="timestamp">Timestamp</SelectItem>
                    <SelectItem value="geopoint">Geopoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldRequired">Required</Label>
                <Select
                  value={newField.required ? "true" : "false"}
                  onValueChange={(value) =>
                    handleFieldChange("required", value === "true")
                  }
                >
                  <SelectTrigger id="fieldRequired">
                    <SelectValue placeholder="Is this field required?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldDescription">Description</Label>
                <Input
                  id="fieldDescription"
                  placeholder="What this field represents"
                  value={newField.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              onClick={addField}
              disabled={!newField.name}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
        </div>

        {/* Relationships Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Relationships</h3>

          {/* Existing Relationships */}
          {schema.relationships.length > 0 && (
            <div className="mb-4 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">From</th>
                    <th className="text-left py-2 px-3 font-medium">To</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">
                      Description
                    </th>
                    <th className="text-right py-2 px-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schema.relationships.map((relationship, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-3">{relationship.from}</td>
                      <td className="py-2 px-3">{relationship.to}</td>
                      <td className="py-2 px-3">{relationship.type}</td>
                      <td className="py-2 px-3">{relationship.description}</td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRelationship(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add New Relationship */}
          <div className="bg-gray-50 p-4 rounded-md border space-y-4">
            <h4 className="font-medium">Add New Relationship</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationshipFrom">From</Label>
                <Input
                  id="relationshipFrom"
                  value={newRelationship.from}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationshipTo">To</Label>
                <Input
                  id="relationshipTo"
                  placeholder="e.g. MenuItem, Order"
                  value={newRelationship.to}
                  onChange={(e) =>
                    handleRelationshipChange("to", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationshipType">Type</Label>
                <Select
                  value={newRelationship.type}
                  onValueChange={(value) =>
                    handleRelationshipChange("type", value)
                  }
                >
                  <SelectTrigger id="relationshipType">
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-to-one">One-to-One</SelectItem>
                    <SelectItem value="one-to-many">One-to-Many</SelectItem>
                    <SelectItem value="many-to-one">Many-to-One</SelectItem>
                    <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationshipDescription">Description</Label>
                <Input
                  id="relationshipDescription"
                  placeholder="Describe this relationship"
                  value={newRelationship.description}
                  onChange={(e) =>
                    handleRelationshipChange("description", e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              onClick={addRelationship}
              disabled={!newRelationship.to || !newRelationship.description}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Relationship
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSchema}
            disabled={!schema.name || schema.fields.length === 0 || saving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save Schema"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchemaBuilder;
