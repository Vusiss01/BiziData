import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createRestaurant } from "@/utils/createRestaurant";

interface SimpleAddRestaurantFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SimpleAddRestaurantForm: React.FC<SimpleAddRestaurantFormProps> = ({
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    street: "",
    suburb: "",
    city: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      console.log("Creating restaurant with owner ID:", user.id);

      // Use the createRestaurant utility to handle all the logic
      const restaurant = await createRestaurant(
        user.id,
        formData.name,
        formData.status,
        formData.street,
        formData.suburb,
        formData.city
      );

      console.log("Restaurant created successfully:", restaurant);

      // Show success message
      if (formData.street && formData.suburb && formData.city) {
        toast({
          title: "Success",
          description: "Restaurant created successfully with location",
        });
      } else {
        toast({
          title: "Success",
          description: "Restaurant created successfully (without location)",
        });
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close form
      onClose();
    } catch (error: any) {
      console.error("Error creating restaurant:", error);

      // More detailed error logging
      if (error.details) {
        console.error("Error details:", error.details);
      }
      if (error.hint) {
        console.error("Error hint:", error.hint);
      }
      if (error.code) {
        console.error("Error code:", error.code);
      }

      // Show more detailed error message to user
      toast({
        title: "Error",
        description: `Failed to create restaurant: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Restaurant</CardTitle>
        <CardDescription>
          Create a new restaurant with basic information
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suburb">Suburb</Label>
            <Input
              id="suburb"
              name="suburb"
              value={formData.suburb}
              onChange={handleInputChange}
              placeholder="Enter suburb"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Restaurant"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SimpleAddRestaurantForm;
