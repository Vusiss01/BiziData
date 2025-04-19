import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface DemoNoticeProps {
  onClose?: () => void;
}

const DemoNotice: React.FC<DemoNoticeProps> = ({ onClose }) => {
  const { isDemoAccount } = useAuth();

  if (!isDemoAccount) return null;

  return (
    <Card className="bg-orange-50 border-orange-200 mb-6">
      <CardContent className="p-4 flex items-start justify-between">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-800 mb-1">Demo Account</h3>
            <p className="text-sm text-orange-700">
              You're currently using a demo account. All changes and data will
              be reset when you log out. This account has pre-populated data to
              help you explore the platform's features.
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-orange-700 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DemoNotice;
