import React, { useState, useEffect } from "react";
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
import { Loader2, X, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createRestaurant, WorkingHours } from "@/services/restaurantService";
import { getRestaurantOwners } from "@/services/userService";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";
import { useForm, ValidationRules } from "@/utils/formUtils";
import WorkingHoursSelector from "./WorkingHoursSelector";

interface RestaurantFormProps {
  onSuccess?: () => void;
  onClose: () => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({ onSuccess, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Use our custom error handler
  const {
    error: formError,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'RestaurantForm',
    showToast: false, // We'll handle toasts manually
  });

  // Use our form utility
  const {
    formData,
    errors,
    handleChange,
    handleNestedChange,
    handleSelectChange,
    handleNestedSelectChange,
    validateForm,
  } = useForm(
    {
      name: "",
      status: "active",
      location: {
        street: "",
        suburb: "",
        city: "",
        status: "open",
      },
    },
    {
      // Validation rules
      'name': [ValidationRules.required('Restaurant name is required')],
      'location.street': [ValidationRules.required('Street address is required')],
      'location.suburb': [ValidationRules.required('Suburb is required')],
      'location.city': [ValidationRules.required('City is required')],
    }
  );

  // Fetch restaurant owners
  useEffect(() => {
    const fetchOwners = async () => {
      setLoadingOwners(true);
      try {
        const { data, error } = await getRestaurantOwners();

        if (error) {
          throw error;
        }

        setOwners(data || []);

        // If the current user is an owner, select them by default
        if (user && data) {
          const currentUserAsOwner = data.find(owner => owner.id === user.id);
          if (currentUserAsOwner) {
            setSelectedOwnerId(currentUserAsOwner.id);
          } else if (data.length > 0) {
            // Otherwise select the first owner
            setSelectedOwnerId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant owners:", error);
        toast({
          title: "Error",
          description: "Failed to load restaurant owners",
          variant: "destructive",
        });
      } finally {
        setLoadingOwners(false);
      }
    };

    fetchOwners();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a restaurant",
        variant: "destructive",
      });
      return;
    }

    // Validate owner selection
    if (!selectedOwnerId) {
      toast({
        title: "Validation Error",
        description: "Please select a restaurant owner",
        variant: "destructive",
      });
      return;
    }

    // Use our handleAsync utility for better error handling
    await handleAsync(
      async () => {
        // Create restaurant using our service with the selected owner ID
        const result = await createRestaurant(selectedOwnerId, {
          ...formData,
          working_hours: workingHours,
        });

        if (result.error) {
          throw result.error;
        }

        if (!result.restaurant) {
          throw new Error("Failed to create restaurant");
        }

        toast({
          title: "Success",
          description: `Restaurant "${result.restaurant.name}" created successfully`,
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Close form
        onClose();

        return result;
      },
      {
        action: 'createRestaurant',
        category: ErrorCategory.DATABASE,
        context: { formData, selectedOwnerId, workingHours },
        userMessage: "Failed to create restaurant. Please try again.",
        showToast: true,
      }
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle>Add Restaurant</CardTitle>
        <CardDescription>
          Create a new restaurant with basic information
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Display form-level errors */}
          {formError && (
            <ErrorDisplay
              error={formError}
              variant="compact"
              onDismiss={clearError}
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="hours">Working Hours</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Restaurant Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter restaurant name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">
                  Restaurant Owner <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedOwnerId}
                  onValueChange={setSelectedOwnerId}
                  disabled={loadingOwners || owners.length === 0}
                >
                  <SelectTrigger id="owner">
                    <SelectValue placeholder={loadingOwners ? "Loading owners..." : "Select an owner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(owner => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </SelectItem>
                    ))}
                    {owners.length === 0 && !loadingOwners && (
                      <SelectItem value="none" disabled>
                        No owners available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedOwnerId === "" && (
                  <p className="text-amber-500 text-xs">Please select a restaurant owner</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 pt-4">
              <h3 className="font-medium mb-2">Location Information</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.location?.street || ""}
                    onChange={(e) => handleNestedChange(e, 'location')}
                    placeholder="Enter street address"
                    className={errors['location.street'] ? "border-red-500" : ""}
                  />
                  {errors['location.street'] && (
                    <p className="text-red-500 text-xs">{errors['location.street']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suburb">
                    Suburb <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="suburb"
                    name="suburb"
                    value={formData.location?.suburb || ""}
                    onChange={(e) => handleNestedChange(e, 'location')}
                    placeholder="Enter suburb"
                    className={errors['location.suburb'] ? "border-red-500" : ""}
                  />
                  {errors['location.suburb'] && (
                    <p className="text-red-500 text-xs">{errors['location.suburb']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.location?.city || ""}
                    onChange={(e) => handleNestedChange(e, 'location')}
                    placeholder="Enter city"
                    className={errors['location.city'] ? "border-red-500" : ""}
                  />
                  {errors['location.city'] && (
                    <p className="text-red-500 text-xs">{errors['location.city']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-status">Location Status</Label>
                  <Select
                    value={formData.location?.status || "open"}
                    onValueChange={(value) => handleNestedSelectChange("status", value, "location")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Working Hours</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Set restaurant operating hours
                </div>
              </div>

              <WorkingHoursSelector
                value={workingHours}
                onChange={setWorkingHours}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex space-x-2">
            {activeTab !== "basic" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab(activeTab === "hours" ? "location" : "basic")}
              >
                Previous
              </Button>
            )}

            {activeTab !== "hours" ? (
              <Button
                type="button"
                onClick={() => setActiveTab(activeTab === "basic" ? "location" : "hours")}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Restaurant"
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RestaurantForm;
