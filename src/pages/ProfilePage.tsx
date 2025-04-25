import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Save, Loader2, Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, updateUser, uploadProfileImage } from "@/services/userService";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";
import FileUpload from "@/components/common/FileUpload";

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "admin", // Default to admin as requested
    phone: "",
    address: "",
    current_suburb: "",
  });

  const [userData, setUserData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Use our custom error handler
  const {
    error,
    isLoading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'ProfilePage',
    showToast: true,
  });

  // Fetch user data
  useEffect(() => {
    if (authUser) {
      fetchUserData();
    }
  }, [authUser]);

  const fetchUserData = async () => {
    await handleAsync(
      async () => {
        const { authUser, dbUser, error } = await getCurrentUser();

        if (error) {
          throw error;
        }

        if (!dbUser) {
          throw new Error("User data not found");
        }

        setUserData(dbUser);

        // Initialize form data
        setProfileData({
          name: dbUser.name || "",
          email: dbUser.email || "",
          role: dbUser.role || "admin",
          phone: dbUser.phone || "",
          address: dbUser.address || "",
          current_suburb: dbUser.current_suburb || "",
        });

        return dbUser;
      },
      {
        action: 'fetchUserData',
        category: ErrorCategory.AUTHENTICATION,
        userMessage: "Failed to load user profile. Please try again.",
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setProfileData((prev) => ({ ...prev, role: value }));
  };

  const handleProfileImageUpload = async () => {
    if (!profileImage || !userData) return;

    setIsUploading(true);

    try {
      const result = await uploadProfileImage(userData.id, profileImage);

      if (result.error) {
        throw result.error;
      }

      // Update user data with new profile image
      setUserData(prev => ({
        ...prev,
        profile_image_url: result.url,
      }));

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });

      // Clear the selected file
      setProfileImage(null);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !userData) return;

    await handleAsync(
      async () => {
        // Update user profile
        const result = await updateUser(userData.id, {
          name: profileData.name,
          role: profileData.role,
          phone: profileData.phone,
          address: profileData.address,
          current_suburb: profileData.current_suburb,
        });

        if (result.error) {
          throw result.error;
        }

        if (!result.data) {
          throw new Error("Failed to update profile");
        }

        // Update user data with new information
        setUserData(result.data);

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });

        return result.data;
      },
      {
        action: 'updateProfile',
        category: ErrorCategory.DATABASE,
        userMessage: "Failed to update profile. Please try again.",
      }
    );
  };

  if (isLoading && !userData) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {error && (
        <ErrorDisplay
          error={error}
          onRetry={fetchUserData}
          onDismiss={clearError}
          className="mb-6"
        />
      )}

      {userData && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                  <AvatarImage src={userData.profile_image_url} alt={profileData.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-800">
                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="absolute -bottom-2 -right-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full h-8 w-8"
                    onClick={() => document.getElementById('profile-image-upload')?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProfileImage(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <CardTitle className="text-xl">{profileData.name}</CardTitle>
                <CardDescription>{profileData.email}</CardDescription>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profileData.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : profileData.role === 'owner'
                      ? 'bg-blue-100 text-blue-800'
                      : profileData.role === 'driver'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profileData.role === 'admin'
                      ? 'Administrator'
                      : profileData.role === 'owner'
                      ? 'Restaurant Owner'
                      : profileData.role === 'driver'
                      ? 'Driver'
                      : 'Customer'}
                  </span>
                </div>
              </div>
            </div>

            {profileImage && (
              <div className="mt-4 flex items-center space-x-2">
                <p className="text-sm text-gray-500 mr-2">
                  Selected: {profileImage.name}
                </p>
                <Button
                  size="sm"
                  onClick={handleProfileImageUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProfileImage(null)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        value={profileData.email}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={profileData.role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Restaurant Owner</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Your role determines what you can do in the system
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone || ""}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      value={profileData.address || ""}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Your address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_suburb">Current Suburb</Label>
                  <Input
                    id="current_suburb"
                    name="current_suburb"
                    value={profileData.current_suburb || ""}
                    onChange={handleInputChange}
                    placeholder="Your current suburb"
                  />
                </div>
              </div>

              <CardFooter className="px-0 pt-4">
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
