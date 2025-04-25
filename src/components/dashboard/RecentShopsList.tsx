import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Store } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  created_at: string;
}

const RecentShopsList = () => {
  const supabase = getSupabaseClient();

  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['recentRestaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id,name,created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
      }

      return data || [];
    },
  });

  // Function to format the date
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
        <p className="text-sm">Loading recent restaurants...</p>
      </div>
    );
  }

  if (error || !restaurants || restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>No restaurants found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Store className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">{restaurant.name}</p>
              <p className="text-sm text-gray-500">
                Restaurant • {formatDate(restaurant.created_at)}
              </p>
            </div>
          </div>
          <Link to={`/restaurants/${restaurant.id}`}>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default RecentShopsList;
