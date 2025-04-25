import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Download, AlertCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { getLocalErrorLogs, clearLocalErrorLogs } from '@/services/errorLogger';
import { AppError, ErrorSeverity } from '@/utils/errorHandler';

const ErrorLogsViewer = () => {
  const [logs, setLogs] = useState<AppError[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const loadLogs = () => {
    setLoading(true);
    const errorLogs = getLocalErrorLogs();
    setLogs(errorLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all error logs?')) {
      clearLocalErrorLogs();
      setLogs([]);
    }
  };

  const handleDownloadLogs = () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = activeTab === 'all' 
    ? logs 
    : logs.filter(log => log.severity === activeTab);

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return <Info className="h-4 w-4 text-blue-500" />;
      case ErrorSeverity.WARNING:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case ErrorSeverity.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case ErrorSeverity.CRITICAL:
        return <AlertOctagon className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'bg-blue-100 text-blue-800';
      case ErrorSeverity.WARNING:
        return 'bg-amber-100 text-amber-800';
      case ErrorSeverity.ERROR:
        return 'bg-red-100 text-red-800';
      case ErrorSeverity.CRITICAL:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Error Logs</CardTitle>
            <CardDescription>
              View and manage application error logs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              {logs.length > 0 && (
                <Badge className="ml-2 bg-gray-100 text-gray-800">{logs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={ErrorSeverity.INFO}>
              Info
              {logs.filter(log => log.severity === ErrorSeverity.INFO).length > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {logs.filter(log => log.severity === ErrorSeverity.INFO).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={ErrorSeverity.WARNING}>
              Warning
              {logs.filter(log => log.severity === ErrorSeverity.WARNING).length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  {logs.filter(log => log.severity === ErrorSeverity.WARNING).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={ErrorSeverity.ERROR}>
              Error
              {logs.filter(log => log.severity === ErrorSeverity.ERROR).length > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {logs.filter(log => log.severity === ErrorSeverity.ERROR).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={ErrorSeverity.CRITICAL}>
              Critical
              {logs.filter(log => log.severity === ErrorSeverity.CRITICAL).length > 0 && (
                <Badge className="ml-2 bg-purple-100 text-purple-800">
                  {logs.filter(log => log.severity === ErrorSeverity.CRITICAL).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {activeTab !== 'all' ? activeTab : ''} error logs found
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className="border rounded-md overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(log.severity)}
                        <span className="font-medium">{log.message}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                        {log.code && (
                          <Badge variant="outline">Code: {log.code}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-3 text-sm">
                      <div className="mb-2">
                        <span className="font-medium">User Message:</span> {log.userMessage}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Timestamp:</span> {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <div className="mb-2">
                          <span className="font-medium">Context:</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        {logs.length > 0 ? (
          <span>Showing {filteredLogs.length} of {logs.length} logs</span>
        ) : (
          <span>No error logs found</span>
        )}
      </CardFooter>
    </Card>
  );
};

export default ErrorLogsViewer;
