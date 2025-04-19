import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Clock, Database, Edit, Server, Upload } from "lucide-react";

type ActivityType =
  | "schema_created"
  | "schema_modified"
  | "schema_deployed"
  | "connection_added"
  | "project_created";

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  timestamp: string;
  project: string;
  details?: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  title?: string;
  maxHeight?: string;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "schema_created":
      return <Database className="h-4 w-4 text-blue-500" />;
    case "schema_modified":
      return <Edit className="h-4 w-4 text-amber-500" />;
    case "schema_deployed":
      return <Upload className="h-4 w-4 text-green-500" />;
    case "connection_added":
      return <Server className="h-4 w-4 text-purple-500" />;
    case "project_created":
      return <Database className="h-4 w-4 text-indigo-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityLabel = (type: ActivityType) => {
  switch (type) {
    case "schema_created":
      return <Badge variant="secondary">Schema Created</Badge>;
    case "schema_modified":
      return <Badge variant="secondary">Schema Modified</Badge>;
    case "schema_deployed":
      return <Badge variant="secondary">Schema Deployed</Badge>;
    case "connection_added":
      return <Badge variant="secondary">Connection Added</Badge>;
    case "project_created":
      return <Badge variant="secondary">Project Created</Badge>;
    default:
      return <Badge variant="secondary">Activity</Badge>;
  }
};

const ActivityFeed = ({
  activities = [
    {
      id: "1",
      type: "schema_created",
      user: {
        name: "Alex Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        initials: "AJ",
      },
      timestamp: "10 minutes ago",
      project: "E-commerce Database",
      details: "Created initial schema with users and products tables",
    },
    {
      id: "2",
      type: "schema_modified",
      user: {
        name: "Sarah Miller",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        initials: "SM",
      },
      timestamp: "1 hour ago",
      project: "Analytics Platform",
      details: "Added indexes to improve query performance",
    },
    {
      id: "3",
      type: "schema_deployed",
      user: {
        name: "David Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        initials: "DC",
      },
      timestamp: "3 hours ago",
      project: "Customer CRM",
      details: "Deployed schema to production environment",
    },
    {
      id: "4",
      type: "connection_added",
      user: {
        name: "Emily Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
        initials: "EW",
      },
      timestamp: "Yesterday",
      project: "IoT Data Warehouse",
      details: "Added new PostgreSQL connection",
    },
    {
      id: "5",
      type: "project_created",
      user: {
        name: "Michael Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
        initials: "MB",
      },
      timestamp: "2 days ago",
      project: "Healthcare Database",
      details: "Started new project for patient records management",
    },
  ],
  title = "Recent Activity",
  maxHeight = "400px",
}: ActivityFeedProps) => {
  return (
    <Card className="w-full h-full bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`pr-4 -mr-4`} style={{ maxHeight }}>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <Avatar className="h-8 w-8">
                  {activity.user.avatar ? (
                    <AvatarImage
                      src={activity.user.avatar}
                      alt={activity.user.name}
                    />
                  ) : (
                    <AvatarFallback>{activity.user.initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.user.name}</p>
                    <span className="text-xs text-gray-500">
                      {activity.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="flex items-center space-x-1">
                      {getActivityIcon(activity.type)}
                      <span className="text-xs text-gray-700">
                        {activity.project}
                      </span>
                    </span>
                    <span className="mx-1">•</span>
                    {getActivityLabel(activity.type)}
                  </div>
                  {activity.details && (
                    <p className="text-xs text-gray-600">{activity.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
