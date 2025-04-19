import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Server,
  Cpu,
  Database,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ServerStatusProps {
  name?: string;
  status?: "online" | "warning" | "offline";
  responseTime?: number;
  uptime?: number;
}

const ServerStatus = ({
  name = "Main Server",
  status = "online",
  responseTime = 42,
  uptime = 99.98,
}: ServerStatusProps) => {
  const statusColors = {
    online: "text-green-500",
    warning: "text-amber-500",
    offline: "text-red-500",
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <Server className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{name}</p>
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
            <span className="text-sm text-muted-foreground capitalize">
              {status}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Response Time</div>
        <div className="font-medium">{responseTime}ms</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Uptime</div>
        <div className="font-medium">{uptime}%</div>
      </div>
    </div>
  );
};

interface ResourceUtilizationProps {
  title?: string;
  value?: number;
  icon?: React.ReactNode;
}

const ResourceUtilization = ({
  title = "CPU Usage",
  value = 45,
  icon = <Cpu className="h-4 w-4" />,
}: ResourceUtilizationProps) => {
  const getProgressColor = (value: number) => {
    if (value < 50) return "bg-green-500";
    if (value < 80) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor(value)} transition-all duration-300 ease-in-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

interface AlertItemProps {
  message?: string;
  time?: string;
  severity?: "low" | "medium" | "high";
}

const AlertItem = ({
  message = "Database connection timeout",
  time = "10 minutes ago",
  severity = "medium",
}: AlertItemProps) => {
  const severityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-start gap-3 p-3 border-b last:border-0">
      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">{message}</p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${severityColors[severity]}`}
          >
            {severity}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{time}</p>
      </div>
    </div>
  );
};

interface HealthMonitorProps {
  servers?: ServerStatusProps[];
  resources?: ResourceUtilizationProps[];
  alerts?: AlertItemProps[];
}

const HealthMonitor = ({
  servers = [
    { name: "Main Server", status: "online", responseTime: 42, uptime: 99.98 },
    {
      name: "Backup Server",
      status: "online",
      responseTime: 56,
      uptime: 99.95,
    },
    {
      name: "Development Server",
      status: "warning",
      responseTime: 127,
      uptime: 98.72,
    },
  ],
  resources = [
    { title: "CPU Usage", value: 45, icon: <Cpu className="h-4 w-4" /> },
    {
      title: "Memory Usage",
      value: 72,
      icon: <Activity className="h-4 w-4" />,
    },
    { title: "Disk Space", value: 28, icon: <Database className="h-4 w-4" /> },
  ],
  alerts = [
    {
      message: "Database connection timeout",
      time: "10 minutes ago",
      severity: "medium",
    },
    {
      message: "High CPU usage detected",
      time: "25 minutes ago",
      severity: "high",
    },
    {
      message: "New security update available",
      time: "1 hour ago",
      severity: "low",
    },
  ],
}: HealthMonitorProps) => {
  return (
    <div className="bg-background w-full h-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Server Status</h3>
            <div className="space-y-3">
              {servers.map((server, index) => (
                <ServerStatus key={index} {...server} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Resource Utilization</h3>
            <div className="space-y-4">
              {resources.map((resource, index) => (
                <ResourceUtilization key={index} {...resource} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recent Alerts</h3>
            <div className="border rounded-lg overflow-hidden">
              {alerts.map((alert, index) => (
                <AlertItem key={index} {...alert} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthMonitor;
