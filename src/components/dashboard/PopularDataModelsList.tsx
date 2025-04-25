import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, Loader2, AlertCircle } from 'lucide-react';

interface DataModel {
  id: string;
  name: string;
  usage_count: number;
  type: string;
}

const PopularDataModelsList = () => {
  const supabase = getSupabaseClient();

  const { data: dataModels, isLoading, error } = useQuery({
    queryKey: ['popularDataModels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_models')
        .select('id,name,usage_count,type')
        .order('usage_count', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching data models:', error);
        throw error;
      }

      return data || [];
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
      <div className="flex items-center justify-center p-4 text-gray-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>No data models found</p>
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
                {model.usage_count} active users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {model.type.charAt(0).toUpperCase() + model.type.slice(1)}
            </span>
            <Link to={`/models/${model.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopularDataModelsList;
