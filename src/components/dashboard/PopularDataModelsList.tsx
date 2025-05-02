import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, Loader2, AlertCircle } from 'lucide-react';
import { getPopularDataModels, initializeDefaultDataModels, DataModel } from '@/services/dataModelService';

const PopularDataModelsList = () => {
  // Initialize default data models if none exist
  useEffect(() => {
    initializeDefaultDataModels()
      .then(success => {
        if (success) {
          console.log('Data models initialized or already exist');
        }
      })
      .catch(error => {
        console.error('Failed to initialize data models:', error);
      });
  }, []);

  // Fetch popular data models using React Query
  const { data: dataModels, isLoading, error } = useQuery({
    queryKey: ['popularDataModels'],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      try {
        console.log('Fetching popular data models from Firebase');
        return await getPopularDataModels(5);
      } catch (error) {
        console.error('Error fetching popular data models:', error);
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
        <p className="text-sm">Loading popular data models...</p>
      </div>
    );
  }

  if (error || !dataModels || dataModels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-lg font-medium">No data models found</p>
        <p className="text-sm text-center mt-1">
          Data models will appear here once they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dataModels.map((model) => (
        <div
          key={model.id}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">{model.name}</p>
              <p className="text-sm text-gray-500">
                {model.usageCount} active users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {model.category.charAt(0).toUpperCase() + model.category.slice(1)}
            </span>
            <Link to={`/data-models/${model.id}`}>
              <Button variant="outline" size="sm">
                Details
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopularDataModelsList;
