import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Database, Server, Users } from "lucide-react";

interface StatisticCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

const StatisticCard = ({
  title = "Statistic",
  value = "0",
  change = "+0%",
  isPositive = true,
  icon = <Database className="h-5 w-5" />,
}: StatisticCardProps) => {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-full bg-muted p-2">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs mt-1">
          <span className={isPositive ? "text-green-500" : "text-red-500"}>
            {change}
          </span>
          <ArrowUpRight
            className={`h-3 w-3 ml-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
          />
          <span className="text-muted-foreground ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatisticsCardsProps {
  statistics?: {
    totalProjects: string;
    activeSchemas: string;
    databaseConnections: string;
    activeUsers: string;
    projectsChange: string;
    schemasChange: string;
    connectionsChange: string;
    usersChange: string;
  };
}

const StatisticsCards = ({
  statistics = {
    totalProjects: "124",
    activeSchemas: "87",
    databaseConnections: "32",
    activeUsers: "18",
    projectsChange: "+12%",
    schemasChange: "+7%",
    connectionsChange: "-3%",
    usersChange: "+22%",
  },
}: StatisticsCardsProps) => {
  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Total Projects"
          value={statistics.totalProjects}
          change={statistics.projectsChange}
          isPositive={!statistics.projectsChange.includes("-")}
          icon={<Database className="h-5 w-5" />}
        />
        <StatisticCard
          title="Active Schemas"
          value={statistics.activeSchemas}
          change={statistics.schemasChange}
          isPositive={!statistics.schemasChange.includes("-")}
          icon={<Server className="h-5 w-5" />}
        />
        <StatisticCard
          title="Database Connections"
          value={statistics.databaseConnections}
          change={statistics.connectionsChange}
          isPositive={!statistics.connectionsChange.includes("-")}
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
        <StatisticCard
          title="Active Users"
          value={statistics.activeUsers}
          change={statistics.usersChange}
          isPositive={!statistics.usersChange.includes("-")}
          icon={<Users className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};

export default StatisticsCards;
