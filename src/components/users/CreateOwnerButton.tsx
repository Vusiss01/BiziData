import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddOwnerForm from "@/components/users/AddOwnerForm";
import { toast } from "@/components/ui/use-toast";

interface CreateOwnerButtonProps {
  onOwnerCreated?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const CreateOwnerButton: React.FC<CreateOwnerButtonProps> = ({
  onOwnerCreated,
  variant = "default",
  size = "default",
  className = "",
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleOwnerCreated = () => {
    console.log("Owner created successfully, triggering refresh");

    toast({
      title: "Success",
      description: "Restaurant owner created successfully. Refreshing owner list...",
    });

    setIsDialogOpen(false);

    // Add a small delay to ensure the database has time to update
    setTimeout(() => {
      console.log("Calling onOwnerCreated callback to refresh owner list");
      if (onOwnerCreated) {
        onOwnerCreated();
      }
    }, 1000);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenDialog}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Create Owner
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <AddOwnerForm
            onClose={handleCloseDialog}
            onSuccess={handleOwnerCreated}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateOwnerButton;
