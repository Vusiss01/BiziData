import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { WorkingHours, DEFAULT_WORKING_HOURS } from '@/services/restaurantService';

interface WorkingHoursSelectorProps {
  workingHours: WorkingHours[];
  onChange: (workingHours: WorkingHours[]) => void;
}

const WorkingHoursSelector: React.FC<WorkingHoursSelectorProps> = ({
  workingHours = DEFAULT_WORKING_HOURS,
  onChange
}) => {
  // Initialize with default hours if none provided
  const [hours, setHours] = React.useState<WorkingHours[]>(
    workingHours.length ? workingHours : DEFAULT_WORKING_HOURS
  );

  // Update parent component when hours change
  React.useEffect(() => {
    onChange(hours);
  }, [hours, onChange]);

  // Handle changes to a specific day's hours
  const handleHoursChange = (index: number, field: keyof WorkingHours, value: string | boolean) => {
    const updatedHours = [...hours];

    if (field === 'is_closed') {
      updatedHours[index].is_closed = value as boolean;
    } else {
      updatedHours[index][field as 'open' | 'close' | 'day'] = value as string;
    }

    setHours(updatedHours);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium mb-2">Working Hours</div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-sm font-medium text-gray-500">
        <div>Day</div>
        <div className="col-span-2">Opening Time</div>
        <div className="col-span-2">Closing Time</div>
        <div className="col-span-2">Closed</div>
      </div>

      {hours.map((hour, index) => (
        <div key={hour.day} className="grid grid-cols-7 gap-2 items-center">
          <div className="font-medium">{hour.day}</div>

          <div className="col-span-2">
            <Input
              type="time"
              value={hour.open}
              onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
              disabled={hour.is_closed}
              className="h-9"
            />
          </div>

          <div className="col-span-2">
            <Input
              type="time"
              value={hour.close}
              onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
              disabled={hour.is_closed}
              className="h-9"
            />
          </div>

          <div className="col-span-2 flex items-center space-x-2">
            <Switch
              checked={hour.is_closed}
              onCheckedChange={(checked) => handleHoursChange(index, 'is_closed', checked)}
              id={`closed-${hour.day}`}
            />
            <Label htmlFor={`closed-${hour.day}`}>Closed</Label>
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-500 mt-2">
        Set your restaurant's operating hours. Toggle 'Closed' for days when the restaurant is not open.
      </p>
    </div>
  );
};

export default WorkingHoursSelector;
