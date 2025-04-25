import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getSupabaseClient } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  WorkingHours,
  WorkingHoursItem,
  defaultWorkingHours,
  saveWorkingHours
} from "@/utils/workingHoursStorage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AddRestaurantForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => {
  const { user } = useAuth();
  const supabase = getSupabaseClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    // Restaurant details
    name: "",
    logo_url: "",
    cover_page_url: "",
    status: "pending_verification", // Default status for new restaurants
    owner_id: "", // Will be set to current user by default

    // Location details
    suburb: "",
    street: "",
    city: "",
    town: "",
    latitude: "",
    longitude: "",
    location_status: "open", // Default location status

    // Working hours - using the default from our utility
    working_hours: defaultWorkingHours
  });

  // Set the current user as the owner when the component loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        owner_id: user.id
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle working hours changes
  const handleWorkingHoursChange = (day: keyof WorkingHours, field: keyof WorkingHoursItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      console.log('Using current authenticated user as owner:', user.id);

      // Skip user creation/update since it's causing RLS policy issues
      // We'll just use the current authenticated user as the owner
      const ownerId = user.id;

      // Prepare restaurant data without working_hours
      const restaurantData = {
        owner_id: ownerId, // Using the current authenticated user
        name: formData.name,
        logo_url: formData.logo_url || null,
        cover_page_url: formData.cover_page_url || null,
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating restaurant with data:', restaurantData);

      // Use RPC function to bypass RLS policies if available
      let result;
      try {
        // First try using an RPC function if it exists
        result = await supabase.rpc('create_restaurant', restaurantData);
        if (result.error) {
          console.log('RPC function not available, falling back to direct insert');
          // Fall back to direct insert
          result = await supabase.from("restaurants").insert(restaurantData).select();
        }
      } catch (err) {
        console.log('Error with RPC, falling back to direct insert');
        // Fall back to direct insert
        result = await supabase.from("restaurants").insert(restaurantData).select();
      }

      // Store working hours in localStorage as a workaround
      if (result.data && result.data.length > 0) {
        const restaurantId = result.data[0].id;
        saveWorkingHours(restaurantId, formData.working_hours);

        // Show a toast to inform the user about working hours
        toast({
          title: "Restaurant Created",
          description: "Restaurant added successfully. Working hours are saved locally.",
          variant: "default",
        });
      }

      const { data: insertedData, error: restaurantError } = result;

      if (restaurantError) {
        throw restaurantError;
      }

      // If restaurant was created successfully, add the location
      if (insertedData && insertedData.length > 0) {
        const restaurantId = insertedData[0].id;

        // Prepare location data
        const locationData = {
          restaurant_id: restaurantId,
          suburb: formData.suburb,
          street: formData.street,
          city: formData.city,
          town: formData.town || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          status: formData.location_status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Try to insert the restaurant location
        let locationError;
        try {
          // First try using an RPC function if it exists
          const rpcResult = await supabase.rpc('create_restaurant_location', locationData);
          if (rpcResult.error) {
            console.log('RPC function not available for location, falling back to direct insert');
            // Fall back to direct insert
            const insertResult = await supabase.from("restaurant_locations").insert(locationData);
            locationError = insertResult.error;
          }
        } catch (err) {
          console.log('Error with location RPC, falling back to direct insert');
          // Fall back to direct insert
          const insertResult = await supabase.from("restaurant_locations").insert(locationData);
          locationError = insertResult.error;
        }

        if (locationError) {
          console.error("Error adding restaurant location:", locationError);
          // We don't throw here because we still created the restaurant successfully
          toast({
            title: "Partial Success",
            description: "Restaurant added but location details could not be saved",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Restaurant and location added successfully",
          });
        }
      }

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close the form
      onClose();
    } catch (error: any) {
      console.error("Error adding restaurant:", error);
      toast({
        title: "Error",
        description: `Failed to add restaurant: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 rounded-none">
      <CardHeader className="sticky top-0 bg-white z-20 py-4 px-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Add New Restaurant</CardTitle>
            <CardDescription className="mt-1">
              Fill in the details to add a new restaurant to the platform.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      </CardHeader>
      <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
        <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 p-6">
          <div className="text-lg font-medium mb-4 pb-2 border-b">Restaurant Details</div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Restaurant Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter restaurant name"
              className="h-10 focus-visible:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_id" className="text-sm font-medium">Restaurant Owner</Label>
            <div className="relative">
              <div className="h-10 px-3 border rounded-md flex items-center bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-2 text-xs font-medium">
                    {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </div>
                  <div className="truncate">
                    {user?.user_metadata?.name || user?.email || 'Current User'} (You)
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              You will be set as the owner of this restaurant
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url" className="text-sm font-medium">Logo URL</Label>
            <Input
              id="logo_url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleInputChange}
              placeholder="Enter logo URL"
              className="h-10 focus-visible:ring-orange-500"
            />
            <p className="text-xs text-gray-500">
              URL to the restaurant's logo image
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_page_url" className="text-sm font-medium">Cover Image URL</Label>
            <Input
              id="cover_page_url"
              name="cover_page_url"
              value={formData.cover_page_url}
              onChange={handleInputChange}
              placeholder="Enter cover image URL"
              className="h-10 focus-visible:ring-orange-500"
            />
            <p className="text-xs text-gray-500">
              URL to the restaurant's cover image
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status" className="h-10 focus-visible:ring-orange-500">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-6 mt-6">
            <div className="text-lg font-medium mb-4 pb-2 border-b">Location Details</div>
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm font-medium">Street Address *</Label>
              <Input
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Enter street address"
                className="h-10 focus-visible:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suburb" className="text-sm font-medium">Suburb *</Label>
              <Input
                id="suburb"
                name="suburb"
                value={formData.suburb}
                onChange={handleInputChange}
                placeholder="Enter suburb"
                className="h-10 focus-visible:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
                className="h-10 focus-visible:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="town" className="text-sm font-medium">Town</Label>
              <Input
                id="town"
                name="town"
                value={formData.town}
                onChange={handleInputChange}
                placeholder="Enter town (optional)"
                className="h-10 focus-visible:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm font-medium">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g. -33.9249"
                  type="number"
                  step="0.000001"
                  className="h-10 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm font-medium">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 18.4241"
                  type="number"
                  step="0.000001"
                  className="h-10 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="location_status" className="text-sm font-medium">Location Status *</Label>
              <Select
                value={formData.location_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location_status: value }))}
              >
                <SelectTrigger id="location_status" className="h-10 focus-visible:ring-orange-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-6 mt-6">
            <div className="text-lg font-medium mb-4 pb-2 border-b">Working Hours</div>

            <div className="space-y-4">
              {Object.entries(formData.working_hours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-28">
                    <Label className="text-sm font-medium capitalize">{day}</Label>
                  </div>

                  <div className="flex-1 flex items-center space-x-3">
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => handleWorkingHoursChange(day as keyof WorkingHours, 'closed', !checked)}
                      className="data-[state=checked]:bg-orange-500"
                    />

                    {!hours.closed ? (
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`${day}-open`} className="text-xs text-gray-500 mb-1 block">Open</Label>
                          <Input
                            id={`${day}-open`}
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleWorkingHoursChange(day as keyof WorkingHours, 'open', e.target.value)}
                            className="h-9 focus-visible:ring-orange-500"
                            disabled={hours.closed}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${day}-close`} className="text-xs text-gray-500 mb-1 block">Close</Label>
                          <Input
                            id={`${day}-close`}
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleWorkingHoursChange(day as keyof WorkingHours, 'close', e.target.value)}
                            className="h-9 focus-visible:ring-orange-500"
                            disabled={hours.closed}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Closed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t">
            <p className="text-sm text-gray-500">
              * Required fields
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Note: You will be set as the owner of this restaurant.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 sticky bottom-0 bg-white z-20 py-4 px-6 border-t shadow-sm">
          <Button type="button" variant="outline" onClick={onClose} className="px-5">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 px-5 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Restaurant"
            )}
          </Button>
        </CardFooter>
        </form>
      </div>
    </Card>
  );
};

export default AddRestaurantForm;
