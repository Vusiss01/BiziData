import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WorkingHours } from "@/services/restaurantService";

interface WorkingHoursSelectorProps {
  value: WorkingHours[];
  onChange: (hours: WorkingHours[]) => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
] as const;

const DEFAULT_HOURS: WorkingHours[] = DAYS_OF_WEEK.map(day => ({
  day: day.id,
  open_time: '09:00',
  close_time: '17:00',
  is_closed: day.id === 'sunday', // Default closed on Sunday
}));

const WorkingHoursSelector: React.FC<WorkingHoursSelectorProps> = ({
  value = DEFAULT_HOURS,
  onChange,
  className = '',
}) => {
  // Initialize with default hours if empty
  React.useEffect(() => {
    if (!value || value.length === 0) {
      onChange(DEFAULT_HOURS);
    }
  }, []);

  const handleHoursChange = (index: number, field: keyof WorkingHours, newValue: any) => {
    const updatedHours = [...value];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: newValue,
    };
    onChange(updatedHours);
  };

  // Apply same hours to all days
  const applyToAll = (sourceIndex: number) => {
    const sourceHours = value[sourceIndex];
    const updatedHours = value.map((day, i) => {
      if (i !== sourceIndex) {
        return {
          ...day,
          open_time: sourceHours.open_time,
          close_time: sourceHours.close_time,
        };
      }
      return day;
    });
    onChange(updatedHours);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-7 gap-2 text-xs font-medium text-center text-gray-500 mb-1">
        <div>Day</div>
        <div className="col-span-2">Opening Time</div>
        <div className="col-span-2">Closing Time</div>
        <div>Closed</div>
        <div>Apply</div>
      </div>

      {value.map((hours, index) => (
        <div key={hours.day} className="grid grid-cols-7 gap-2 items-center">
          <div className="text-sm font-medium">
            {DAYS_OF_WEEK.find(d => d.id === hours.day)?.label}
          </div>
          
          <div className="col-span-2">
            <Input
              type="time"
              value={hours.open_time}
              onChange={(e) => handleHoursChange(index, 'open_time', e.target.value)}
              disabled={hours.is_closed}
              className={`h-9 ${hours.is_closed ? 'opacity-50' : ''}`}
            />
          </div>
          
          <div className="col-span-2">
            <Input
              type="time"
              value={hours.close_time}
              onChange={(e) => handleHoursChange(index, 'close_time', e.target.value)}
              disabled={hours.is_closed}
              className={`h-9 ${hours.is_closed ? 'opacity-50' : ''}`}
            />
          </div>
          
          <div className="flex justify-center">
            <Switch
              checked={hours.is_closed}
              onCheckedChange={(checked) => handleHoursChange(index, 'is_closed', checked)}
            />
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => applyToAll(index)}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              disabled={hours.is_closed}
            >
              Apply to all
            </button>
          </div>
        </div>
      ))}
      
      <div className="text-xs text-gray-500 mt-2">
        Note: Toggle the switch to mark a day as closed.
      </div>
    </div>
  );
};

export default WorkingHoursSelector;
