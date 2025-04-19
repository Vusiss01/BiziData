import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Mail, Lock, User, Database } from "lucide-react";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultTab?: "login" | "signup" | "demo";
}

const AuthModal = ({
  isOpen = true,
  onClose = () => {},
  defaultTab = "login",
}: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "demo">(
    defaultTab,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Database Platform
          </DialogTitle>
          <DialogDescription className="text-center">
            Manage your database schemas with AI assistance
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "login" | "signup" | "demo")
          }
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="demo">Try Demo</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    placeholder="your@email.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button className="w-full">Login</Button>
            </div>
            <div className="text-center text-sm">
              <a href="#" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input id="name" placeholder="John Doe" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    placeholder="your@email.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="signup-password"
                  className="text-sm font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button className="w-full">Create Account</Button>
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-4 py-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Try Demo Account</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Explore the platform with a pre-configured demo account. No
                  signup required.
                </p>
              </div>
              <Button className="w-full">Access Demo</Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <div className="text-xs text-gray-500 mb-4 sm:mb-0">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
