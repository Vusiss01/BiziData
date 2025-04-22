import React, { useState } from "react";
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
import { Loader2, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AddOwnerFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AddOwnerForm = ({ onClose, onSuccess }: AddOwnerFormProps) => {
  const { user } = useAuth();
  const supabase = getSupabaseClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // User details
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    bio: "",
    role: "restaurant_owner", // Default role for this form
    display_name: "",
    avatar_url: "",
    is_verified: true, // Admin-created accounts are verified by default
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
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

      // Then, add the user to our users table
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        bio: formData.bio || null,
        role: formData.role,
        display_name: formData.display_name || formData.name,
        avatar_url: avatarUrl || null,
        is_verified: formData.is_verified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id,
      });

      if (userError) {
        throw userError;
      }

      toast({
        title: "Success",
        description: "Restaurant owner added successfully",
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close the form
      onClose();
    } catch (error: any) {
      console.error("Error adding restaurant owner:", error);
      toast({
        title: "Error",
        description: `Failed to add restaurant owner: ${error.message || "Unknown error"}`,
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
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="bg-orange-100 text-orange-800 text-xl">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
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
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Enter bio or description"
                className="min-h-[100px] focus-visible:ring-orange-500"
              />
            </div>

            <div className="text-lg font-medium mb-4 pb-2 border-b mt-6">Account Settings</div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">User Role *</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role" className="h-10 focus-visible:ring-orange-500">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant_owner">Restaurant Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
