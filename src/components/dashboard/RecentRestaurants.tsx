import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { convertTimestamps } from '@/services/databaseService';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  created_at: Date;
}

const RecentRestaurants = () => {
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['recentRestaurants'],
    queryFn: async () => {
      try {
        console.log('Fetching recent restaurants from Firebase');

        // Create query to get 5 most recent restaurants
        const restaurantsQuery = query(
          collection(db, 'restaurants'),
          orderBy('created_at', 'desc'),
          limit(5)
        );

        // Execute query
        const snapshot = await getDocs(restaurantsQuery);

        // Process results
        const restaurantData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure rating is a valid number
          let rating = 0;
          if (data.rating !== undefined && data.rating !== null) {
            rating = typeof data.rating === 'number' ? data.rating : 0;
          }

          return convertTimestamps({
            id: doc.id,
            name: data.name || 'Unnamed Restaurant',
            cuisine: data.cuisine || 'Various',
            rating: rating,
            address: data.address || 'No address',
            created_at: data.created_at
          });
        });

        return restaurantData as Restaurant[];
      } catch (error) {
        console.error('Error fetching recent restaurants:', error);
        throw error;
      }
    },
  });



  // Helper function to format date
  const formatDate = (date: Date | null | undefined): string => {
    try {
      if (!date) {
        return 'Unknown date';
      }

      // Check if date is valid
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('Invalid date:', date);
        return 'Unknown date';
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Helper function to render stars
  const renderStars = (rating: number) => {
    try {
      // Ensure rating is a valid number
      const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;

      // Clamp rating between 0 and 5
      const clampedRating = Math.max(0, Math.min(5, validRating));

      const stars = [];
      const fullStars = Math.floor(clampedRating);
      const hasHalfStar = clampedRating % 1 >= 0.5;

      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      }

      if (hasHalfStar) {
        stars.push(
          <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400 half-filled" />
        );
      }

      const emptyStars = 5 - stars.length;
      for (let i = 0; i < emptyStars; i++) {
        stars.push(
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        );
      }

      return stars;
    } catch (error) {
      console.error('Error rendering stars:', error);
      // Return 5 empty stars as fallback
      return Array(5).fill(null).map((_, i) => (
        <Star key={`empty-fallback-${i}`} className="h-4 w-4 text-gray-300" />
      ));
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Recent Restaurants</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
            <p>Loading recent restaurants...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>Error loading restaurants</p>
          </div>
        ) : restaurants && restaurants.length > 0 ? (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <h3 className="font-medium">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                  <div className="flex items-center mt-1">
                    {renderStars(restaurant.rating || 0)}
                    <span className="text-sm ml-1">{(restaurant.rating || 0).toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{restaurant.address}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(restaurant.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            <p>No recent restaurants found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentRestaurants;
