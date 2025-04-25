import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { checkUserSynchronization } from '@/utils/diagnostics';
import { syncUser } from '@/utils/userSync';

const UserSyncStatus = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSync = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkUserSynchronization();
      setStatus(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred checking user synchronization');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setError(null);
    try {
      if (!status?.authUser?.id) {
        throw new Error('No authenticated user to synchronize');
      }
      
      const userData = await syncUser(status.authUser.id);
      if (!userData) {
        throw new Error('Failed to synchronize user');
      }
      
      // Refresh status
      await checkSync();
    } catch (err: any) {
      setError(err.message || 'An error occurred synchronizing user');
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    checkSync();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          User Synchronization Status
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Check if your user is properly synchronized between Auth and Database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Synchronization Status:</span>
              {status.synchronized ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" /> Synchronized
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-1" /> Not Synchronized
                </span>
              )}
            </div>

            {status.authUser && (
              <div>
                <h3 className="text-sm font-medium mb-1">Auth User:</h3>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div><span className="font-medium">ID:</span> {status.authUser.id}</div>
                  <div><span className="font-medium">Email:</span> {status.authUser.email}</div>
                  <div>
                    <span className="font-medium">Name:</span> 
                    {status.authUser.user_metadata?.name || 'Not set'}
                  </div>
                </div>
              </div>
            )}

            {status.dbUser ? (
              <div>
                <h3 className="text-sm font-medium mb-1">Database User:</h3>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div><span className="font-medium">ID:</span> {status.dbUser.id}</div>
                  <div><span className="font-medium">Email:</span> {status.dbUser.email}</div>
                  <div><span className="font-medium">Name:</span> {status.dbUser.name}</div>
                  <div><span className="font-medium">Role:</span> {status.dbUser.role}</div>
                </div>
              </div>
            ) : status.authUser ? (
              <Alert variant="warning" className="text-xs">
                <AlertCircle className="h-3 w-3" />
                <AlertTitle className="text-xs">Missing Database User</AlertTitle>
                <AlertDescription className="text-xs">
                  You are authenticated but don't have a corresponding database user record.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkSync} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
        
        {status && !status.synchronized && (
          <Button onClick={handleSync} disabled={syncLoading}>
            {syncLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Synchronizing...
              </>
            ) : (
              'Synchronize User'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UserSyncStatus;
