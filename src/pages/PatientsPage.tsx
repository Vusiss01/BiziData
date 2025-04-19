import React, { useState } from "react";
import PatientsList from "@/components/patients/PatientsList";
import AddPatientModal from "@/components/patients/AddPatientModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const PatientsPage = () => {
  const [showAddPatient, setShowAddPatient] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
      </div>

      <PatientsList onAddPatient={() => setShowAddPatient(true)} />

      <AddPatientModal
        isOpen={showAddPatient}
        onClose={() => setShowAddPatient(false)}
        onSave={(data) => {
          console.log("Saving patient data:", data);
          setShowAddPatient(false);
        }}
      />
    </div>
  );
};

export default PatientsPage;
