import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Store } from 'lucide-react';
import { db } from '@/lib/firebase';

// Define the Restaurant interface for type safety
interface Restaurant {
  id: string;
  name: string;
  created_at: Date | string;
}

const RecentShopsList = () => {
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['recentRestaurants'],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async (): Promise<Restaurant[]> => {
      try {
        console.log('Fetching recent restaurants from Firebase');

        // Import necessary Firebase functions
        const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');

        // Create query to get 5 most recent restaurants
        const restaurantsQuery = query(
          collection(db, 'restaurants'),
          orderBy('created_at', 'desc'),
          limit(5)
        );

        // Execute query
        const snapshot = await getDocs(restaurantsQuery);

        console.log(`Query returned ${snapshot.docs.length} recent restaurants`);

        // Process results
        const restaurantData: Restaurant[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Restaurant',
            created_at: data.created_at?.toDate?.() || data.created_at || new Date()
          };
        });

        return restaurantData;
      } catch (err) {
        console.error('Error fetching recent restaurants:', err);
        throw err;
      }
    },
  });

  // Function to format the date
  function formatDate(dateValue: Date | string | null | undefined) {
    try {
      // Handle null or undefined
      if (dateValue === null || dateValue === undefined) {
        return 'Unknown date';
      }

      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateValue);
        return 'Unknown date';
      }

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
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
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
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-lg font-medium">No restaurants found</p>
        <p className="text-sm text-center mt-1">
          Restaurants will appear here once they are created.
        </p>
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
