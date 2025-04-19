import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateProjectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (projectData: any) => void;
}

const CreateProjectModal = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
}: CreateProjectModalProps) => {
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    databaseType: "",
    apiKey: "",
    enableRealtime: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setProjectData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSave(projectData);
    setProjectData({
      name: "",
      description: "",
      databaseType: "",
      apiKey: "",
      enableRealtime: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={projectData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                className="min-h-[100px]"
                value={projectData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="databaseType">Database Type</Label>
              <Select
                value={projectData.databaseType}
                onValueChange={(value) => handleChange("databaseType", value)}
              >
                <SelectTrigger id="databaseType">
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mongodb">MongoDB</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="firebase">Firebase</SelectItem>
                  <SelectItem value="supabase">Supabase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                placeholder="Enter API key if you have one"
                value={projectData.apiKey}
                onChange={(e) => handleChange("apiKey", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave blank to generate a new API key automatically
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableRealtime"
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                checked={projectData.enableRealtime as boolean}
                onChange={(e) =>
                  handleChange("enableRealtime", e.target.checked)
                }
              />
              <Label htmlFor="enableRealtime">
                Enable real-time data synchronization
              </Label>
            </div>

            <div className="rounded-md bg-orange-50 p-4 border border-orange-200">
              <h4 className="text-sm font-medium text-orange-800 mb-1">
                Project Limits
              </h4>
              <ul className="text-xs text-orange-700 space-y-1 list-disc pl-4">
                <li>Free tier: 100,000 API requests per month</li>
                <li>10GB storage included</li>
                <li>Up to 5 data models</li>
                <li>Real-time updates (if enabled)</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={!projectData.name || !projectData.databaseType}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
