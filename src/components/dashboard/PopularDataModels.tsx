import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

type DataModel = {
  id: string;
  name: string;
  activeUsers: number;
  type: 'core' | 'extended';
};

const PopularDataModels = () => {
  // Mock data to match the image
  const dataModels: DataModel[] = [
    {
      id: '1',
      name: 'Restaurant Profile',
      activeUsers: 842,
      type: 'core',
    },
    {
      id: '2',
      name: 'Menu Items',
      activeUsers: 756,
      type: 'core',
    },
    {
      id: '3',
      name: 'Order Management',
      activeUsers: 621,
      type: 'core',
    },
    {
      id: '4',
      name: 'Customer Profiles',
      activeUsers: 512,
      type: 'extended',
    },
    {
      id: '5',
      name: 'Delivery Tracking',
      activeUsers: 498,
      type: 'extended',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Popular Data Models</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {dataModels.map((model) => (
            <div key={model.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-md">
                  <Database className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-medium">{model.name}</h3>
                  <p className="text-sm text-gray-500">{model.activeUsers} active users</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs bg-gray-100 rounded-md">
                  {model.type === 'core' ? 'Core' : 'Extended'}
                </span>
                <button className="px-3 py-1 text-xs bg-gray-100 rounded-md">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularDataModels;
