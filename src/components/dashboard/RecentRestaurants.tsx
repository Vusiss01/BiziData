import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Simplified version with minimal data processing
const RecentRestaurants = () => {
  const { data, isLoading, error } = useQuery({
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

        // Process results with minimal transformation
        return snapshot.docs.map(doc => {
          const data = doc.data();

          // Create a safe restaurant object with only string/number values
          return {
            id: doc.id,
            name: data.name || 'Unnamed Restaurant',
            cuisine: data.cuisine_type || data.cuisine || 'Various',
            // Ensure rating is a valid number
            rating: typeof data.rating === 'number' ? data.rating : 0,
            // Format address as a string or use default
            addressText: formatAddressToString(data.address),
            // Format date as a string
            createdAt: formatDate(data.created_at?.toDate?.() || data.created_at)
          };
        });
      } catch (error) {
        console.error('Error fetching recent restaurants:', error);
        throw error;
      }
    },
  });

  // Helper function to safely format an address to a string
  function formatAddressToString(address: any): string {
    try {
      // Handle string addresses
      if (typeof address === 'string') {
        return address;
      }

      // Handle null/undefined
      if (!address) {
        return 'No address';
      }

      // Handle empty objects
      if (typeof address === 'object' && Object.keys(address).length === 0) {
        return 'No address details';
      }

      // Handle address objects
      if (typeof address === 'object') {
        // Try standard address format
        const parts = [
          address.street,
          address.city,
          address.state,
          address.zipCode,
          address.country
        ].filter(Boolean);

        if (parts.length > 0) {
          return parts.join(', ');
        }

        // Try to extract any string values
        const values = Object.values(address)
          .filter(val => val && typeof val !== 'object' && typeof val !== 'function')
          .map(val => String(val));

        if (values.length > 0) {
          return values.join(', ');
        }
      }

      // Default fallback
      return 'Address unavailable';
    } catch (err) {
      console.error('Error formatting address:', err);
      return 'Address error';
    }
  }

  // Helper function to format date
  function formatDate(date: any): string {
    try {
      if (!date) {
        return 'Unknown date';
      }

      // Convert to Date object if it's not already
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown date';
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  }

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
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((restaurant) => (
              <div key={restaurant.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <h3 className="font-medium">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                  <div className="flex items-center mt-1">
                    {renderStars(restaurant.rating)}
                    <span className="text-sm ml-1">{restaurant.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {restaurant.addressText}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {restaurant.createdAt}
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
