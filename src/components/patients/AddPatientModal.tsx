import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddPatientModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (patientData: any) => void;
}

const AddPatientModal = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
}: AddPatientModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add New Patient
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="medical">Medical History</TabsTrigger>
            <TabsTrigger value="contact">Contact Details</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Enter first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Enter last name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select>
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" placeholder="Enter ID number" />
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Current Condition</Label>
              <Input id="condition" placeholder="Enter current condition" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input id="allergies" placeholder="Enter allergies" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Input id="medications" placeholder="Enter current medications" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Medical Notes</Label>
              <Input id="notes" placeholder="Enter medical notes" />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Enter phone number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Enter address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Enter city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" placeholder="Enter postal code" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Patient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientModal;
