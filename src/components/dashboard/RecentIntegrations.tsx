import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Integration = {
  id: string;
  name: string;
  type: string;
  timeAgo: string;
};

const RecentIntegrations = () => {
  // Mock data to match the image
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Pizza Palace',
      type: 'Restaurant',
      timeAgo: 'Today',
    },
    {
      id: '2',
      name: 'Burger Bonanza',
      type: 'Restaurant',
      timeAgo: 'Yesterday',
    },
    {
      id: '3',
      name: 'Sushi Supreme',
      type: 'Restaurant',
      timeAgo: '2 days ago',
    },
    {
      id: '4',
      name: 'Taco Time',
      type: 'Restaurant',
      timeAgo: '3 days ago',
    },
    {
      id: '5',
      name: 'Pasta Paradise',
      type: 'Restaurant',
      timeAgo: '4 days ago',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Integrations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {integration.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{integration.name}</h3>
                  <p className="text-sm text-gray-500">
                    {integration.type} • {integration.timeAgo}
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 text-xs bg-gray-100 rounded-md">
                Details
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentIntegrations;
