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
import { Loader2, X, Clock, RefreshCw, UserPlus } from "lucide-react";
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
import CreateOwnerButton from "@/components/users/CreateOwnerButton";

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
      clearError(); // Clear any previous errors

      try {
        console.log("Fetching restaurant owners from database...");
        const { data, error } = await getRestaurantOwners();

        if (error) {
          console.error("Error from getRestaurantOwners:", error);
          throw error;
        }

        // Log the actual data received
        console.log("Restaurant owners data received:", JSON.stringify(data));

        if (!data || data.length === 0) {
          console.warn("No restaurant owners found in database");

          // Don't use mock data, instead encourage creating a real owner
          setOwners([]);
          setSelectedOwnerId("");

          toast({
            title: "No Restaurant Owners",
            description: "No restaurant owners found in database. Please create one.",
            variant: "default",
          });

          setLoadingOwners(false);
          return;
        }

        console.log(`Found ${data.length} restaurant owners in database`);

        // Filter to only include users with role "owner" or "Restaurant Owner"
        const filteredOwners = data.filter(owner => {
          const role = owner.role?.toLowerCase();
          return role === 'owner' || role === 'restaurant owner';
        });

        console.log(`After filtering, ${filteredOwners.length} restaurant owners remain`);

        if (filteredOwners.length === 0) {
          console.warn("No users with restaurant owner role found after filtering");
          setOwners([]);
          setSelectedOwnerId("");

          toast({
            title: "No Restaurant Owners",
            description: "No users with restaurant owner role found in database. Please create one.",
            variant: "default",
          });

          setLoadingOwners(false);
          return;
        }

        // Use the filtered owners
        setOwners(filteredOwners);

        // Always select the first owner by default if available
        if (filteredOwners.length > 0) {
          console.log(`Selecting first owner by default: ${filteredOwners[0].name} (${filteredOwners[0].id})`);
          setSelectedOwnerId(filteredOwners[0].id);
        }

        // If the current user is an owner, select them by default instead
        if (user && filteredOwners) {
          const currentUserAsOwner = filteredOwners.find(owner => owner.id === user.id);
          if (currentUserAsOwner) {
            console.log(`Current user is an owner, selecting them by default`);
            setSelectedOwnerId(currentUserAsOwner.id);
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant owners:", error);

        // Don't use mock data, instead show an error and encourage creating a real owner
        setOwners([]);
        setSelectedOwnerId("");

        toast({
          title: "Error",
          description: "Failed to load restaurant owners from database. Please try refreshing or create a new owner.",
          variant: "destructive",
        });
      } finally {
        setLoadingOwners(false);
      }
    };

    fetchOwners();
  }, [user, clearError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    console.log("Form submission started");
    console.log("Current form data:", formData);
    console.log("Selected owner ID:", selectedOwnerId);
    console.log("Working hours:", workingHours);

    // Validate form
    if (!validateForm()) {
      console.error("Form validation failed");
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      console.error("User not authenticated");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a restaurant",
        variant: "destructive",
      });
      return;
    }

    // Validate owner selection
    if (!selectedOwnerId || selectedOwnerId === "" || selectedOwnerId === "none" || selectedOwnerId === "loading") {
      console.error("No restaurant owner selected");

      // If we have owners but none selected, show error
      if (owners.length > 0) {
        toast({
          title: "Validation Error",
          description: "Please select a restaurant owner",
          variant: "destructive",
        });
        return;
      }

      // If no owners available, create a temporary one
      console.log("No owners available, creating a temporary one");
      const tempOwner = {
        id: "temp-owner-" + Date.now(),
        name: "Temporary Owner",
        email: "temp@example.com",
        role: "owner",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setOwners([tempOwner]);
      setSelectedOwnerId(tempOwner.id);

      toast({
        title: "Notice",
        description: "Using a temporary owner for this restaurant",
        variant: "default",
      });
    }

    // Use our handleAsync utility for better error handling
    await handleAsync(
      async () => {
        console.log("Starting restaurant creation with data:", {
          ownerId: selectedOwnerId,
          formData,
          workingHours
        });

        // Create restaurant using our service with the selected owner ID
        const result = await createRestaurant(selectedOwnerId, {
          ...formData,
          working_hours: workingHours,
        });

        console.log("Restaurant creation result:", result);

        if (result.error) {
          console.error("Error creating restaurant:", result.error);
          throw result.error;
        }

        if (!result.restaurant) {
          console.error("No restaurant returned from createRestaurant");
          throw new Error("Failed to create restaurant - no restaurant data returned");
        }

        console.log("Restaurant created successfully:", result.restaurant);

        toast({
          title: "Success",
          description: `Restaurant "${result.restaurant.name}" created successfully`,
        });

        // Call success callback
        if (onSuccess) {
          console.log("Calling onSuccess callback");
          onSuccess();
        }

        // Close form
        console.log("Closing form");
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="owner">
                    Restaurant Owner <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoadingOwners(true);
                        console.log("Manually refreshing restaurant owners...");
                        getRestaurantOwners().then(({ data, error }) => {
                          console.log("Refreshed owners result:", { data, error });

                          if (error) {
                            console.error("Error refreshing owners:", error);
                            toast({
                              title: "Error",
                              description: "Failed to refresh restaurant owners. See console for details.",
                              variant: "destructive",
                            });
                          }

                          if (data && data.length > 0) {
                            console.log(`Found ${data.length} owners:`, data);
                            setOwners(data);

                            // Select the first owner if none is selected
                            if (!selectedOwnerId || selectedOwnerId === "") {
                              console.log(`Auto-selecting first owner: ${data[0].id}`);
                              setSelectedOwnerId(data[0].id);
                            }

                            toast({
                              title: "Success",
                              description: `Found ${data.length} restaurant owners`,
                              variant: "default",
                            });
                          } else {
                            console.warn("No restaurant owners found after refresh");
                            setOwners([]);
                            setSelectedOwnerId("");

                            toast({
                              title: "No Owners Found",
                              description: "No restaurant owners found. Please create one.",
                              variant: "default",
                            });
                          }
                        }).finally(() => {
                          setLoadingOwners(false);
                        });
                      }}
                      disabled={loadingOwners}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    <CreateOwnerButton
                      variant="outline"
                      size="sm"
                      onOwnerCreated={() => {
                        // Refresh the owners list after creating a new owner
                        setLoadingOwners(true);
                        console.log("Owner created, refreshing restaurant owners list...");

                        getRestaurantOwners().then(({ data, error }) => {
                          console.log("Refreshed owners after creation:", { data, error });

                          if (error) {
                            console.error("Error refreshing owners after creation:", error);
                            toast({
                              title: "Warning",
                              description: "Owner created but there was an issue refreshing the list.",
                              variant: "default",
                            });
                          }

                          if (data && data.length > 0) {
                            console.log(`Found ${data.length} owners after creation`);
                            setOwners(data);

                            // Find the most recently created owner
                            const sortedOwners = [...data].sort((a, b) => {
                              const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                              const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                              return dateB.getTime() - dateA.getTime();
                            });

                            const newestOwner = sortedOwners[0];
                            console.log("Selecting most recently created owner:", newestOwner);
                            setSelectedOwnerId(newestOwner.id);

                            toast({
                              title: "Owner Selected",
                              description: `Selected newly created owner: ${newestOwner.name}`,
                              variant: "default",
                            });
                          } else {
                            console.warn("No owners found after creation - this is unexpected");
                            setOwners([]);
                          }
                        }).finally(() => {
                          setLoadingOwners(false);
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <Select
                    value={selectedOwnerId}
                    onValueChange={(value) => {
                      console.log(`Owner selected: ${value}`);
                      setSelectedOwnerId(value);
                    }}
                    disabled={loadingOwners}
                  >
                    <SelectTrigger id="owner" className={selectedOwnerId === "" ? "border-red-500" : ""}>
                      <SelectValue placeholder={loadingOwners ? "Loading owners..." : "Select an owner"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOwners ? (
                        <SelectItem value="loading" disabled>
                          Loading owners...
                        </SelectItem>
                      ) : owners.length > 0 ? (
                        owners.map(owner => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name} ({owner.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No owners available. Please create an owner first.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {loadingOwners && (
                    <div className="absolute right-10 top-3">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    </div>
                  )}
                </div>

                {selectedOwnerId === "" && (
                  <p className="text-red-500 text-xs">Please select a restaurant owner</p>
                )}

                <div className="text-xs text-gray-500 mt-1">
                  {owners.length > 0 ?
                    `${owners.length} owner(s) available from database` :
                    "No restaurant owners found in database. Please create one using the button above."}
                </div>

                {/* Debug info - remove in production */}
                <div className="text-xs text-gray-400 mt-1 border-t pt-1">
                  <details>
                    <summary>Debug Info</summary>
                    <pre className="text-xs overflow-auto max-h-20 bg-gray-100 p-1 rounded">
                      {JSON.stringify({selectedOwnerId, ownersCount: owners.length}, null, 2)}
                    </pre>
                  </details>
                </div>
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
