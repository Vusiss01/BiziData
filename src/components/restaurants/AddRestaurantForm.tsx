import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getSupabaseClient } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
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
  });

  // Fetch users for the owner dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      setLoadingUsers(true);
      try {
        // Fetch users from the users table
        console.log('Fetching users from the users table...');
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role');

        console.log('Users from database:', data);

        // If no users found, create a dummy user for testing
        if (!data || data.length === 0) {
          console.log('No users found in database, creating dummy user');

          // Try to create a user record for the current user if it doesn't exist
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              name: user.user_metadata?.name || 'Current User',
              email: user.email,
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating user record:', insertError);
          } else {
            console.log('Created user record for current user');
          }

          // Use the current user as a fallback
          const dummyData = [{
            id: user.id,
            name: user.user_metadata?.name || 'Current User',
            email: user.email,
            role: 'admin'
          }];

          setUsers(dummyData);
          setFormData(prev => ({
            ...prev,
            owner_id: user.id
          }));

          return;
        }

        if (error) {
          throw error;
        }

        console.log('Users fetched for dropdown:', data);

        // If we have users, set them in state
        setUsers(data || []);

        // Set current user as default owner
        setFormData(prev => ({
          ...prev,
          owner_id: user.id
        }));
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: `Failed to load users: ${error.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user, supabase, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      // Insert the new restaurant
      const { data: restaurantData, error: restaurantError } = await supabase.from("restaurants").insert({
        owner_id: formData.owner_id || user.id, // Use selected owner or current user
        name: formData.name,
        logo_url: formData.logo_url || null,
        cover_page_url: formData.cover_page_url || null,
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select();

      if (restaurantError) {
        throw restaurantError;
      }

      // If restaurant was created successfully, add the location
      if (restaurantData && restaurantData.length > 0) {
        const restaurantId = restaurantData[0].id;

        // Insert the restaurant location
        const { error: locationError } = await supabase.from("restaurant_locations").insert({
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
        });

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
            <Label htmlFor="owner_id" className="text-sm font-medium">Restaurant Owner *</Label>
            <div className="relative">
              {loadingUsers ? (
                <Select disabled>
                  <SelectTrigger className="h-10 bg-gray-50">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-orange-500" />
                      <span className="text-gray-500">Loading users...</span>
                    </div>
                  </SelectTrigger>
                </Select>
              ) : (
                <Select
                  value={formData.owner_id}
                  onValueChange={(value) => {
                    // Find the selected user to display their info
                    const selectedUser = users.find(u => u.id === value);
                    setFormData(prev => ({ ...prev, owner_id: value }));
                  }}
                >
                  <SelectTrigger className="h-10 focus-visible:ring-orange-500 bg-white">
                    <SelectValue placeholder="Select owner">
                      {/* Only show selected user info when not open */}
                      {formData.owner_id && (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-2 text-xs font-medium">
                            {users.find(u => u.id === formData.owner_id)?.name?.charAt(0) || '?'}
                          </div>
                          <div className="truncate">
                            {users.find(u => u.id === formData.owner_id)?.name || 'Selected User'}
                          </div>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="p-0 overflow-hidden">
                    <div className="py-2 px-3 border-b sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search users..."
                          className="pl-8 h-9 focus-visible:ring-orange-500"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-72">
                      {users.length > 0 ? (
                        users
                          .filter(u =>
                            (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                          )
                          .map(u => (
                            <SelectItem
                              key={u.id}
                              value={u.id}
                              className="py-2 px-3 cursor-pointer focus:bg-orange-50 data-[state=checked]:bg-orange-50 data-[state=checked]:text-orange-900"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
                                  {u.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">{u.name || 'Unnamed User'}</span>
                                  <span className="text-xs text-gray-500">
                                    {u.email || 'No email'}
                                    {u.role ? ` · ${u.role}` : ''}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <div className="py-4 px-3 text-sm text-gray-500 text-center">
                          No users found in database
                        </div>
                      )}
                      {users.length > 0 && users.filter(u =>
                        (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="py-4 px-3 text-sm text-gray-500 text-center">
                          No users match your search
                        </div>
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Select the user who will own this restaurant
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
