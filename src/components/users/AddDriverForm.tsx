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
import { Loader2, Upload, MapPin, Car } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const supabase = getSupabaseClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

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
        // First check if regions table exists
        const { error: tableCheckError } = await supabase
          .from('regions')
          .select('id')
          .limit(1);

        // If table doesn't exist or there's an error, create mock regions
        if (tableCheckError) {
          console.log('Regions table may not exist, using mock data');
          const mockRegionData = [
            { id: 'region-1', name: 'Downtown' },
            { id: 'region-2', name: 'Uptown' },
            { id: 'region-3', name: 'Midtown' },
            { id: 'region-4', name: 'West End' },
            { id: 'region-5', name: 'East Side' }
          ];
          setRegions(mockRegionData);
          setFormData(prev => ({ ...prev, region_id: mockRegionData[0].id }));
          return;
        }

        // If table exists, try to fetch regions
        const { data, error } = await supabase
          .from('regions')
          .select('id, name');

        if (error) throw error;

        if (data && data.length > 0) {
          setRegions(data);
          setFormData(prev => ({ ...prev, region_id: data[0].id }));
        } else {
          // No regions found, create a default one
          try {
            const { data: newRegion, error: createError } = await supabase
              .from('regions')
              .insert({ name: 'Default Region' })
              .select();

            if (createError) throw createError;

            if (newRegion && newRegion.length > 0) {
              setRegions(newRegion);
              setFormData(prev => ({ ...prev, region_id: newRegion[0].id }));
            }
          } catch (insertError) {
            console.error('Error creating default region:', insertError);
            // Fall back to mock data if we can't create a region
            const mockRegionData = [
              { id: 'region-1', name: 'Downtown' },
              { id: 'region-2', name: 'Uptown' }
            ];
            setRegions(mockRegionData);
            setFormData(prev => ({ ...prev, region_id: mockRegionData[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching regions:', error);
        // Fall back to mock data
        const mockRegionData = [
          { id: 'region-1', name: 'Downtown' },
          { id: 'region-2', name: 'Uptown' },
          { id: 'region-3', name: 'Midtown' },
          { id: 'region-4', name: 'West End' }
        ];
        setRegions(mockRegionData);
        setFormData(prev => ({ ...prev, region_id: mockRegionData[0].id }));
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
  }, [supabase]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifiedChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_verified: checked }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLicenseFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicensePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVehicleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVehicleFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehiclePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const uploadLicense = async (userId: string): Promise<string | null> => {
    if (!licenseFile) return null;

    try {
      const fileExt = licenseFile.name.split('.').pop();
      const fileName = `${userId}-license-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `driver-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, licenseFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading license:', error);
      return null;
    }
  };

  const uploadVehicleImage = async (userId: string): Promise<string | null> => {
    if (!vehicleFile) return null;

    try {
      const fileExt = vehicleFile.name.split('.').pop();
      const fileName = `${userId}-vehicle-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, vehicleFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading vehicle image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // First, create the user in auth
      // Note: Using signUp instead of admin.createUser as it might not be available in all Supabase instances
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Since we're using signUp, we need to manually confirm the email
      // In a real app, you'd use admin functions or email confirmation
      // For this demo, we'll just create the user record

      // Upload avatar if provided
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(authData.user.id);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Upload vehicle image if provided
      let vehicleImageUrl = formData.vehicle_image_url;
      if (vehicleFile) {
        const uploadedUrl = await uploadVehicleImage(authData.user.id);
        if (uploadedUrl) {
          vehicleImageUrl = uploadedUrl;
        }
      }

      // Then, add the user to our users table
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        role: formData.role,
        display_name: formData.display_name || formData.name,
        avatar_url: avatarUrl || null,
        is_verified: formData.is_verified,
        current_suburb: formData.current_suburb || null,
        vehicle_image_url: vehicleImageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id,
      });

      if (userError) {
        throw userError;
      }

      // Upload license document if provided
      if (licenseFile) {
        const licenseUrl = await uploadLicense(authData.user.id);

        if (licenseUrl) {
          try {
            // First check if driver_documents table exists
            const { error: tableCheckError } = await supabase
              .from('driver_documents')
              .select('id')
              .limit(1);

            // Only insert if the table exists
            if (!tableCheckError) {
              // Add driver document record
              const { error: docError } = await supabase.from("driver_documents").insert({
                driver_id: authData.user.id,
                document_type: formData.document_type,
                file_url: licenseUrl,
                status: 'approved', // Auto-approve since admin is creating
                submitted_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
              });

              if (docError) {
                console.error("Error adding driver document:", docError);
                // We don't throw here because the user was still created successfully
              }
            } else {
              console.log('Driver documents table may not exist, skipping document insertion');
            }
          } catch (docError) {
            console.error("Error with driver document operation:", docError);
            // We don't throw here because the user was still created successfully
          }
        }
      }

      // Add driver to the queue for their selected region
      if (formData.region_id) {
        try {
          // First check if driver_queue table exists
          const { error: tableCheckError } = await supabase
            .from('driver_queue')
            .select('id')
            .limit(1);

          // Only insert if the table exists
          if (!tableCheckError) {
            const { error: queueError } = await supabase.from("driver_queue").insert({
              driver_id: authData.user.id,
              region_id: formData.region_id,
              login_at: new Date().toISOString(),
              status: 'offline', // Default status for new drivers
            });

            if (queueError) {
              console.error("Error adding driver to queue:", queueError);
              // We don't throw here because the user was still created successfully
            }
          } else {
            console.log('Driver queue table may not exist, skipping queue insertion');
          }
        } catch (queueError) {
          console.error("Error with driver queue operation:", queueError);
          // We don't throw here because the user was still created successfully
        }
      }

      toast({
        title: "Success",
        description: "Driver added successfully",
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close the form
      onClose();
    } catch (error: any) {
      console.error("Error adding driver:", error);
      toast({
        title: "Error",
        description: `Failed to add driver: ${error.message || "Unknown error"}`,
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
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="bg-orange-100 text-orange-800 text-xl">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "D"}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </div>
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
                <Label className="text-sm font-medium">Driver's License Document *</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {licensePreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={licensePreview}
                          alt="License preview"
                          className="max-h-40 max-w-full object-contain mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          {licenseFile?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Car className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="license-upload"
                            className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
                          >
                            <span>Upload license</span>
                            <input
                              id="license-upload"
                              name="license-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*,.pdf"
                              onChange={handleLicenseChange}
                              required={!licenseFile}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Vehicle Image</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {vehiclePreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={vehiclePreview}
                          alt="Vehicle preview"
                          className="max-h-40 max-w-full object-contain mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          {vehicleFile?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Car className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="vehicle-upload"
                            className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
                          >
                            <span>Upload vehicle image</span>
                            <input
                              id="vehicle-upload"
                              name="vehicle-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleVehicleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
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
                checked={formData.is_verified}
                onCheckedChange={handleVerifiedChange}
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
