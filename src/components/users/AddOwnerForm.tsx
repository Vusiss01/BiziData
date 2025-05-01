import React, { useState } from "react";
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
import { Loader2, Upload, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createUser, CreateUserOptions } from "@/services/userService";
import useErrorHandler from "@/hooks/useErrorHandler";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ErrorCategory } from "@/utils/errorHandler";
import FileUpload from "@/components/common/FileUpload";

interface AddOwnerFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AddOwnerForm = ({ onClose, onSuccess }: AddOwnerFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isVerified, setIsVerified] = useState(true);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Use our custom error handler
  const {
    error: formError,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'AddOwnerForm',
    showToast: false, // We'll handle toasts manually
  });

  // Use state for form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    current_suburb: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifiedChange = (checked: boolean) => {
    setIsVerified(checked);
  };

  // No need for handleRoleChange as the role is fixed to 'owner'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a restaurant owner",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Use our handleAsync utility for better error handling
    await handleAsync(
      async () => {
        console.log("Creating restaurant owner with data:", {
          ...formData,
          role: 'owner',
          hasProfileImage: !!profileImage
        });

        try {
          // Create user with owner role - ensure it's exactly "owner" to match what we're querying for
          console.log("Creating user with role 'owner'");
          const result = await createUser({
            ...formData,
            role: 'owner', // This must match exactly what we query for in getRestaurantOwners
            profileImage,
            is_verified: isVerified, // Pass the verification status from the switch
          });

          // Handle partial success (user created in auth but not in Firestore)
          if (result.error && result.user) {
            console.warn("Partial success creating restaurant owner:", result.error);

            toast({
              title: "Partial Success",
              description: `Restaurant owner "${result.user.name}" created with limited functionality. Some features may not work properly.`,
              variant: "default",
            });

            // Still consider this a success for the UI flow
            if (onSuccess) {
              onSuccess();
            }

            // Close the dialog
            onClose();
            return result;
          }

          // Handle complete failure
          if (result.error) {
            console.error("Error creating restaurant owner:", result.error);
            throw result.error;
          }

          if (!result.user) {
            console.error("No user returned from createUser");
            throw new Error("Failed to create restaurant owner");
          }

          // Handle mock user in development
          if (result.user.isMockUser) {
            console.warn("Created mock restaurant owner for development:", result.user);

            toast({
              title: "Development Mode",
              description: `Mock restaurant owner "${result.user.name}" created for testing purposes.`,
              variant: "default",
            });

            if (onSuccess) {
              onSuccess();
            }

            onClose();
            return result;
          }

          // Handle complete success
          console.log("Restaurant owner created successfully:", result.user);

          toast({
            title: "Success",
            description: `Restaurant owner "${result.user.name}" created successfully`,
          });

          // Call success callback
          if (onSuccess) {
            onSuccess();
          }

          // Close the dialog
          onClose();
          return result;
        } catch (error: any) {
          console.error("Error in restaurant owner creation:", error);

          // Provide more user-friendly error messages
          let userMessage = "Failed to create restaurant owner. Please try again.";

          if (error.message) {
            if (error.message.includes("email-already-in-use") ||
                error.message.includes("already in use")) {
              userMessage = "This email address is already in use. Please use a different email.";
            } else if (error.message.includes("invalid-email")) {
              userMessage = "The email address is not valid.";
            } else if (error.message.includes("weak-password")) {
              userMessage = "The password is too weak. Please use a stronger password.";
            } else if (error.message.includes("permission-denied") ||
                      error.message.includes("insufficient permissions")) {
              userMessage = "You don't have permission to create restaurant owners. Please contact an administrator.";
            }
          }

          throw new Error(userMessage);
        }
      },
      {
        action: 'createUser',
        category: ErrorCategory.AUTHENTICATION,
        context: { formData },
        userMessage: "Failed to create restaurant owner. Please try again.",
        showToast: true,
      }
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 rounded-none">
      <CardHeader className="sticky top-0 bg-white z-20 py-4 px-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Add New Restaurant Owner</CardTitle>
            <CardDescription className="mt-1">
              Create a new user account with restaurant owner privileges.
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
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="h-10 focus-visible:ring-orange-500"
                />
                <p className="text-xs text-gray-500">
                  Name shown publicly (defaults to full name if empty)
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
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="h-10 focus-visible:ring-orange-500"
              />
            </div>

            <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Additional Information</div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                className="min-h-[80px] focus-visible:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter bio or description"
                className="min-h-[100px] focus-visible:ring-orange-500"
              />
            </div>

            <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Account Settings</div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">User Role</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-gray-100 text-sm">
                Restaurant Owner
              </div>
              <p className="text-xs text-gray-500">
                This form creates restaurant owner accounts
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_verified"
                checked={isVerified}
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
                "Create Owner"
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </Card>
  );
};

export default AddOwnerForm;
