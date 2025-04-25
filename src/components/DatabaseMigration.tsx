import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Clipboard, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DatabaseMigration = () => {
  const { toast } = useToast();

  const sqlScript = `-- Migration script to add working_hours column to restaurants table
-- Run this in the Supabase SQL Editor

-- Add working_hours column if it doesn't exist
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS working_hours JSONB;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "SQL script copied to clipboard successfully",
      });
    });
  };

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <div className="flex items-center">
        <InfoIcon className="h-4 w-4 mr-2 text-amber-500" />
        <AlertTitle>Working Hours Feature Notice</AlertTitle>
      </div>
      <AlertDescription>
        <p className="mb-2">
          The working hours feature requires a database update. Currently, working hours will be saved locally but not in the database.
        </p>
        <p className="text-sm mb-3">
          To fully enable this feature, a database administrator needs to add the 'working_hours' column to the restaurants table.
        </p>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Update Instructions
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Database Update Instructions</DialogTitle>
              <DialogDescription>
                Follow these steps to add the working_hours column to the restaurants table.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="font-medium">Step 1: Access Supabase Dashboard</h3>
                <p className="text-sm text-gray-600">
                  Log in to your Supabase dashboard at <a href="https://app.supabase.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://app.supabase.io</a>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Step 2: Open SQL Editor</h3>
                <p className="text-sm text-gray-600">
                  Navigate to the SQL Editor in your project dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Step 3: Run the following SQL script</h3>
                <div className="relative">
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {sqlScript}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  After completing these steps, refresh this page and try adding a restaurant again.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseMigration;
