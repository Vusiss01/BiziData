import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, Package, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TrackingEvent, getRecentTrackingEvents } from '@/services/trackingService';
import { Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';

const LiveTrackingFeed = () => {
  // Use React Query to fetch tracking events
  const {
    data: events = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['trackingEvents'],
    queryFn: () => getRecentTrackingEvents(20),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Helper function to convert Timestamp to Date if needed
  const getDateFromTimestamp = (timestamp: Date | Timestamp): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    // Convert Firestore Timestamp to Date
    return timestamp.toDate();
  };



  const getEventIcon = (type: string) => {
    switch (type) {
      case 'location_update':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'status_change':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'order_assigned':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'order_delivered':
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: TrackingEvent) => {
    switch (event.type) {
      case 'location_update':
        return `Updated location to ${event.location?.address}`;
      case 'status_change':
        return `Status changed to "${event.status}"`;
      case 'order_assigned':
        return `Assigned to order #${event.order?.id} from ${event.order?.restaurant}`;
      case 'order_delivered':
        return `Delivered order #${event.order?.id} from ${event.order?.restaurant}`;
      default:
        return 'Unknown event';
    }
  };

  const getEventStatusColor = (type: string) => {
    switch (type) {
      case 'location_update':
        return 'bg-blue-100 text-blue-800';
      case 'status_change':
        return 'bg-yellow-100 text-yellow-800';
      case 'order_assigned':
        return 'bg-green-100 text-green-800';
      case 'order_delivered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          Live Driver Tracking Feed
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center p-4 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>Error loading tracking data</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-2" />
            <p>Loading tracking data...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Clock className="h-12 w-12 mb-2 text-gray-300" />
            <p className="font-medium">No tracking events</p>
            <p className="text-sm">There are no recent driver activities</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4 -mr-4">
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <Avatar className="h-8 w-8">
                    {event.driver.avatar ? (
                      <AvatarImage
                        src={event.driver.avatar}
                        alt={event.driver.name}
                      />
                    ) : (
                      <AvatarFallback>{event.driver.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{event.driver.name}</p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(getDateFromTimestamp(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="flex items-center space-x-1">
                        {getEventIcon(event.type)}
                        <Badge className={`text-xs ${getEventStatusColor(event.type)}`}>
                          {event.type.replace('_', ' ')}
                        </Badge>
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{getEventDescription(event)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveTrackingFeed;
