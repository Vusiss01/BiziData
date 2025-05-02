import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Loader2, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createUser } from "@/services/userService";
import { addDriver, uploadDriverAvatar } from "@/services/driverService";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";
import FileUpload from "@/components/common/FileUpload";

interface AddDriverFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface Region {
  id: string;
  name: string;
}

const AddDriverForm = ({ onClose, onSuccess }: AddDriverFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  // Use our custom error handler
  const {
    error: formError,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'AddDriverForm',
    showToast: false, // We'll handle toasts manually
  });

  const [formData, setFormData] = useState({
    // User details
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    bio: "",
    role: "driver", // Default role for this form
    display_name: "",
    avatar_url: "",
    is_verified: true, // Admin-created accounts are verified by default

    // Driver specific details
    current_suburb: "",
    vehicle_type: "car", // Default vehicle type
    license_number: "",
    region_id: "",
    vehicle_image_url: "",

    // Document details for license
    document_type: "driver_license",
    document_url: "",
  });

  // Fetch regions for the dropdown
  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      try {
        // Use mock data for now
        const mockRegionData = [
          { id: 'region-1', name: 'Downtown' },
          { id: 'region-2', name: 'Uptown' },
          { id: 'region-3', name: 'Midtown' },
          { id: 'region-4', name: 'West End' },
          { id: 'region-5', name: 'East Side' }
        ];
        setRegions(mockRegionData);
        setFormData(prev => ({ ...prev, region_id: mockRegionData[0].id }));
      } catch (error) {
        console.error('Error fetching regions:', error);
        // Fall back to mock data
        const mockRegionData = [
          { id: 'region-1', name: 'Downtown' },
          { id: 'region-2', name: 'Uptown' }
        ];
        setRegions(mockRegionData);
        setFormData(prev => ({ ...prev, region_id: mockRegionData[0].id }));
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // No longer needed with our new FileUpload component

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a driver",
        variant: "destructive",
      });
      return;
    }

    // Basic validation for all required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.address ||
      !formData.current_suburb ||
      !formData.vehicle_type ||
      !formData.license_number ||
      !formData.region_id
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate license document if required
    if (!licenseFile) {
      toast({
        title: "Validation Error",
        description: "Please upload a driver's license document",
        variant: "destructive",
      });
      return;
    }

    // Use our handleAsync utility for better error handling
    await handleAsync(
      async () => {
        // Create driver in Firebase with all form fields
        const driverId = await addDriver({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: 'driver',
          is_verified: isVerified,
          current_suburb: formData.current_suburb,
          vehicle_type: formData.vehicle_type,
          rating: 0,
          completed_orders: 0,
          // Add missing fields
          address: formData.address,
          license_number: formData.license_number,
          bio: formData.bio,
          region_id: formData.region_id,
          display_name: formData.display_name || formData.name, // Use name as fallback
        });

        if (!driverId) {
          throw new Error("Failed to create driver");
        }

        // Upload profile image if provided
        if (profileImage) {
          const avatarUrl = await uploadDriverAvatar(driverId, profileImage);
          if (!avatarUrl) {
            console.warn("Failed to upload profile image, but driver was created");
          }
        }

        // Upload license document if provided
        if (licenseFile) {
          try {
            const licenseUrl = await uploadDriverDocument(driverId, licenseFile, 'license');
            if (licenseUrl) {
              // Update driver with license document URL
              await updateDriver(driverId, {
                document_url: licenseUrl,
                document_type: 'driver_license'
              });
            }
          } catch (error) {
            console.warn("Failed to upload license document, but driver was created", error);
          }
        }

        // Upload vehicle image if provided
        if (vehicleFile) {
          try {
            const vehicleImageUrl = await uploadDriverDocument(driverId, vehicleFile, 'vehicle');
            if (vehicleImageUrl) {
              // Update driver with vehicle image URL
              await updateDriver(driverId, { vehicle_image_url: vehicleImageUrl });
            }
          } catch (error) {
            console.warn("Failed to upload vehicle image, but driver was created", error);
          }
        }

        toast({
          title: "Success",
          description: `Driver "${formData.name}" created successfully`,
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Close form
        onClose();

        return { driverId };
      },
      {
        action: 'createUser',
        category: ErrorCategory.AUTHENTICATION,
        context: { formData },
        userMessage: "Failed to create driver. Please try again.",
        showToast: true,
      }
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 rounded-none">
      <CardHeader className="sticky top-0 bg-white z-20 py-4 px-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Add New Driver</CardTitle>
            <CardDescription className="mt-1">
              Create a new driver account with delivery capabilities.
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
            <div className="text-lg font-medium mb-4 pb-2 border-b">Account Information</div>

            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              {formError && (
                <ErrorDisplay
                  error={formError}
                  variant="inline"
                  onDismiss={clearError}
                />
              )}

              <FileUpload
                label="Profile Image"
                description="Upload a profile image (JPG, PNG, max 5MB)"
                accept="image/jpeg,image/png"
                value={profileImage}
                onChange={setProfileImage}
                isUploading={loading}
                className="w-full max-w-xs mx-auto"
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="h-10 focus-visible:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm font-medium">Display Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="Enter display name"
                  className="h-10 focus-visible:ring-orange-500"
                />
                <p className="text-xs text-gray-500">
                  Name shown to customers (defaults to full name if empty)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className="h-10 focus-visible:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="h-10 focus-visible:ring-orange-500"
                required
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="h-10 focus-visible:ring-orange-500"
                required
              />
              <p className="text-xs text-gray-500">
                Required for delivery coordination
              </p>
            </div>

            <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Driver Details</div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                className="min-h-[80px] focus-visible:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_suburb" className="text-sm font-medium">Current Suburb *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="current_suburb"
                  name="current_suburb"
                  value={formData.current_suburb}
                  onChange={handleInputChange}
                  placeholder="Enter current suburb"
                  className="h-10 pl-10 focus-visible:ring-orange-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Initial location for delivery assignments
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type" className="text-sm font-medium">Vehicle Type *</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => handleSelectChange('vehicle_type', value)}
                >
                  <SelectTrigger id="vehicle_type" className="h-10 focus-visible:ring-orange-500">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number" className="text-sm font-medium">License Number *</Label>
                <Input
                  id="license_number"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="Enter license number"
                  className="h-10 focus-visible:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region_id" className="text-sm font-medium">Service Region *</Label>
              <Select
                value={formData.region_id}
                onValueChange={(value) => handleSelectChange('region_id', value)}
                disabled={loadingRegions}
              >
                <SelectTrigger id="region_id" className="h-10 focus-visible:ring-orange-500">
                  {loadingRegions ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-orange-500" />
                      <span className="text-gray-500">Loading regions...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select service region" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Primary service area for this driver
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FileUpload
                  label="Driver's License Document"
                  description="Upload a license document (JPG, PNG, PDF, max 5MB)"
                  accept="image/jpeg,image/png,application/pdf"
                  value={licenseFile}
                  onChange={setLicenseFile}
                  isUploading={loading}
                  required={true}
                />
              </div>

              <div className="space-y-2">
                <FileUpload
                  label="Vehicle Image"
                  description="Upload a vehicle image (JPG, PNG, max 5MB)"
                  accept="image/jpeg,image/png"
                  value={vehicleFile}
                  onChange={setVehicleFile}
                  isUploading={loading}
                />
                <p className="text-xs text-gray-500">
                  Photo of the vehicle used for deliveries
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Enter bio or description"
                className="min-h-[100px] focus-visible:ring-orange-500"
              />
            </div>

            <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Account Settings</div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_verified"
                checked={isVerified}
                onCheckedChange={setIsVerified}
                className="data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="is_verified" className="text-sm font-medium">
                Account Verified
              </Label>
              <p className="text-xs text-gray-500 ml-2">
                Admin-created accounts are verified by default
              </p>
            </div>

            <div className="pt-4 mt-6 border-t">
              <p className="text-sm text-gray-500">
                * Required fields
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
                  Creating...
                </>
              ) : (
                "Create Driver"
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </Card>
  );
};

export default AddDriverForm;
