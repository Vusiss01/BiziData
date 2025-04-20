import React, { useState, useEffect } from "react";
import { useAuth, getSupabaseClient } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
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
import { User, Mail, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "admin", // Default to admin as requested
    phone: "",
    address: "",
    current_suburb: "",
  });

  // Use the profile data from the useUserProfile hook
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role || "admin",
        phone: profile.phone || "",
        address: profile.address || "",
        current_suburb: profile.current_suburb || "",
      });
    } else if (user) {
      // Fallback to user metadata if profile not available
      setProfileData({
        name: user.user_metadata?.name || "",
        email: user.email || "",
        role: "admin", // Set default role to admin as requested
        phone: "",
        address: "",
        current_suburb: "",
      });
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setProfileData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      console.log("Updating user profile for ID:", user.id);
      console.log("Profile data to update:", profileData);

      // First update the auth user metadata
      // This is important to do first as it's more likely to succeed
      console.log("Updating auth user metadata with name:", profileData.name);
      const { error: authUpdateError, data: authData } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
        },
      });

      if (authUpdateError) {
        console.error("Error updating auth metadata:", authUpdateError);
        throw authUpdateError;
      }

      console.log("Auth metadata updated successfully:", authData);

      // Now try to update the users table using RPC
      const { data, error } = await supabase
        .rpc('update_user_profile', {
          user_id: user.id,
          user_email: user.email,
          user_name: profileData.name,
          user_role: profileData.role,
          user_phone: profileData.phone,
          user_address: profileData.address,
          user_suburb: profileData.current_suburb
        });

      if (error) {
        console.error("Error updating profile via RPC:", error);

        // Try a direct update as a fallback
        console.log("Attempting direct update to users table");
        const { error: directUpdateError } = await supabase
          .from("users")
          .upsert({
            id: user.id,
            email: user.email,
            name: profileData.name,
            role: profileData.role,
            phone: profileData.phone,
            address: profileData.address,
            current_suburb: profileData.current_suburb,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (directUpdateError) {
          console.error("Error with direct update:", directUpdateError);
          // Show a partial success message
          toast({
            title: "Partial Success",
            description: "Your profile name was updated in the authentication system. Database update failed due to permissions.",
          });
        } else {
          console.log("Direct update successful");
          toast({
            title: "Success",
            description: "Profile updated successfully",
          });
        }
      } else {
        console.log("RPC update successful");
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name}`;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={profileData.name} />
              <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{profileData.name}</CardTitle>
              <CardDescription>{profileData.email}</CardDescription>
            </div>
          </div>
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
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    As requested, you can only select the admin role
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
                disabled={saving}
              >
                {saving ? (
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
    </div>
  );
};

export default ProfilePage;
