import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Smartphone, Globe, Save, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    orderUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
  };
  language: string;
  timezone: string;
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
    orderUpdates: true,
    marketing: false,
  },
  privacy: {
    shareData: true,
    analytics: true,
  },
  appearance: {
    theme: "system",
    compactMode: false,
  },
  language: "en",
  timezone: "UTC",
};

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user settings from Firebase
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if user settings document exists
        const settingsDocRef = doc(db, "user_settings", user.uid);
        const settingsDoc = await getDoc(settingsDocRef);

        if (settingsDoc.exists()) {
          // Use the settings from Firestore
          const userSettings = settingsDoc.data() as UserSettings;
          setSettings(userSettings);
        } else {
          // Use default settings
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error("Error fetching user settings:", err);
        setError(err instanceof Error ? err : new Error("Failed to load settings"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Save settings to Firebase
  const saveSettings = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update settings in Firestore
      const settingsDocRef = doc(db, "user_settings", user.uid);
      await updateDoc(settingsDocRef, settings);

      toast({
        title: "Success",
        description: "Your settings have been saved",
        variant: "default",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update settings
  const updateNotificationSetting = (key: keyof UserSettings["notifications"], value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  const updatePrivacySetting = (key: keyof UserSettings["privacy"], value: boolean) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    });
  };

  const updateAppearanceSetting = (key: keyof UserSettings["appearance"], value: any) => {
    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button 
          className="bg-orange-600 hover:bg-orange-700"
          onClick={saveSettings}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
          <p>Loading settings...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-12 text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <div>
            <p className="font-semibold">Error loading settings</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Notification Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateNotificationSetting("email", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) => updateNotificationSetting("push", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Receive notifications via SMS
                        </p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) => updateNotificationSetting("sms", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Notification Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="order-updates">Order Updates</Label>
                        <p className="text-sm text-gray-500">
                          Notifications about order status changes
                        </p>
                      </div>
                      <Switch
                        id="order-updates"
                        checked={settings.notifications.orderUpdates}
                        onCheckedChange={(checked) => updateNotificationSetting("orderUpdates", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing">Marketing & Promotions</Label>
                        <p className="text-sm text-gray-500">
                          Receive marketing and promotional messages
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={settings.notifications.marketing}
                        onCheckedChange={(checked) => updateNotificationSetting("marketing", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Manage your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Data Sharing</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="share-data">Share Usage Data</Label>
                        <p className="text-sm text-gray-500">
                          Share anonymous usage data to help improve our services
                        </p>
                      </div>
                      <Switch
                        id="share-data"
                        checked={settings.privacy.shareData}
                        onCheckedChange={(checked) => updatePrivacySetting("shareData", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="analytics">Analytics Cookies</Label>
                        <p className="text-sm text-gray-500">
                          Allow analytics cookies to track your usage
                        </p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={settings.privacy.analytics}
                        onCheckedChange={(checked) => updatePrivacySetting("analytics", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Security</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`border rounded-md p-4 cursor-pointer ${
                        settings.appearance.theme === "light"
                          ? "border-orange-500 bg-orange-50"
                          : ""
                      }`}
                      onClick={() => updateAppearanceSetting("theme", "light")}
                    >
                      <div className="h-12 bg-white border mb-2 rounded"></div>
                      <p className="text-sm font-medium text-center">Light</p>
                    </div>
                    <div
                      className={`border rounded-md p-4 cursor-pointer ${
                        settings.appearance.theme === "dark"
                          ? "border-orange-500 bg-orange-50"
                          : ""
                      }`}
                      onClick={() => updateAppearanceSetting("theme", "dark")}
                    >
                      <div className="h-12 bg-gray-800 border mb-2 rounded"></div>
                      <p className="text-sm font-medium text-center">Dark</p>
                    </div>
                    <div
                      className={`border rounded-md p-4 cursor-pointer ${
                        settings.appearance.theme === "system"
                          ? "border-orange-500 bg-orange-50"
                          : ""
                      }`}
                      onClick={() => updateAppearanceSetting("theme", "system")}
                    >
                      <div className="h-12 bg-gradient-to-r from-white to-gray-800 border mb-2 rounded"></div>
                      <p className="text-sm font-medium text-center">System</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Display Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="compact-mode">Compact Mode</Label>
                        <p className="text-sm text-gray-500">
                          Use a more compact layout to fit more content on screen
                        </p>
                      </div>
                      <Switch
                        id="compact-mode"
                        checked={settings.appearance.compactMode}
                        onCheckedChange={(checked) => updateAppearanceSetting("compactMode", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Language & Region</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        className="w-full border rounded-md px-3 py-2"
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        className="w-full border rounded-md px-3 py-2"
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Account Actions</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Export Your Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SettingsPage;
