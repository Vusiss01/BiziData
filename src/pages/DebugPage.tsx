import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import UserSyncStatus from '@/components/debug/UserSyncStatus';
import ErrorLogsViewer from '@/components/debug/ErrorLogsViewer';
import { runSupabaseDiagnostics } from '@/utils/diagnostics';
import { useAuth } from '@/hooks/useAuth';
import useErrorHandler from '@/hooks/useErrorHandler';
import { ErrorCategory } from '@/utils/errorHandler';

const DebugPage = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Use our custom error handler
  const {
    error,
    isLoading: loading,
    handleAsync,
    clearError
  } = useErrorHandler({
    component: 'DebugPage',
    showToast: true,
  });

  const runDiagnostics = async () => {
    await handleAsync(
      async () => {
        const results = await runSupabaseDiagnostics();
        setDiagnostics(results);
        return results;
      },
      {
        action: 'runDiagnostics',
        category: ErrorCategory.UNKNOWN,
        userMessage: 'Failed to run diagnostics. Please try again.',
      }
    );
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Debug & Diagnostics</h1>

      <Tabs defaultValue="user-sync">
        <TabsList className="mb-4">
          <TabsTrigger value="user-sync">User Synchronization</TabsTrigger>
          <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
          <TabsTrigger value="error-logs">Error Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="user-sync">
          <UserSyncStatus />
        </TabsContent>

        <TabsContent value="error-logs">
          <ErrorLogsViewer />
        </TabsContent>

        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>System Diagnostics</CardTitle>
              <CardDescription>
                Run diagnostics to check the health of your Supabase connection and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={clearError}
                  >
                    Dismiss
                  </Button>
                </Alert>
              )}

              {diagnostics && (
                <div className="space-y-6">
                  {/* Connection Status */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Connection Status</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.connection.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>{diagnostics.connection.success ? 'Connected' : 'Connection Failed'}</span>
                      </div>
                      {diagnostics.connection.error && (
                        <div className="text-red-600 text-sm mt-1">{diagnostics.connection.error}</div>
                      )}
                    </div>
                  </div>

                  {/* Authentication */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Authentication</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.authentication.hasSession ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>{diagnostics.authentication.hasSession ? 'Authenticated' : 'Not Authenticated'}</span>
                      </div>
                      {diagnostics.authentication.currentUser && (
                        <div className="text-sm mt-2">
                          <div><span className="font-medium">User ID:</span> {diagnostics.authentication.currentUser.id}</div>
                          <div><span className="font-medium">Email:</span> {diagnostics.authentication.currentUser.email}</div>
                        </div>
                      )}
                      {diagnostics.authentication.error && (
                        <div className="text-red-600 text-sm mt-1">{diagnostics.authentication.error}</div>
                      )}
                    </div>
                  </div>

                  {/* Database Tables */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Database Tables</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.database.usersTable.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium">Users Table:</span>
                          <span className="ml-2">
                            {diagnostics.database.usersTable.exists ? 'Exists' : 'Missing'}
                            {diagnostics.database.usersTable.exists && !diagnostics.database.usersTable.canQuery && ' (No Access)'}
                          </span>
                        </div>
                        {diagnostics.database.usersTable.error && (
                          <div className="text-red-600 text-sm mt-1">{diagnostics.database.usersTable.error}</div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.database.restaurantsTable.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium">Restaurants Table:</span>
                          <span className="ml-2">
                            {diagnostics.database.restaurantsTable.exists ? 'Exists' : 'Missing'}
                            {diagnostics.database.restaurantsTable.exists && !diagnostics.database.restaurantsTable.canQuery && ' (No Access)'}
                          </span>
                        </div>
                        {diagnostics.database.restaurantsTable.error && (
                          <div className="text-red-600 text-sm mt-1">{diagnostics.database.restaurantsTable.error}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Synchronization */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">User Synchronization</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.userSync.currentUserInDb ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>
                          {diagnostics.userSync.currentUserInDb
                            ? 'User exists in database'
                            : 'User missing from database'}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.userSync.canCreateUser ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>
                          {diagnostics.userSync.canCreateUser
                            ? 'Can create users'
                            : 'Cannot create users'}
                        </span>
                      </div>
                      {diagnostics.userSync.error && (
                        <div className="text-red-600 text-sm mt-1">{diagnostics.userSync.error}</div>
                      )}
                    </div>
                  </div>

                  {/* RPC Functions */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">RPC Functions</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.rpcFunctions.updateUserProfile.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">update_user_profile:</span>
                        <span className="ml-2">
                          {diagnostics.rpcFunctions.updateUserProfile.exists ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      {diagnostics.rpcFunctions.updateUserProfile.error && (
                        <div className="text-red-600 text-sm mt-1">{diagnostics.rpcFunctions.updateUserProfile.error}</div>
                      )}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Permissions</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${diagnostics.permissions.canInsertRestaurant ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>
                          {diagnostics.permissions.canInsertRestaurant
                            ? 'Can create restaurants'
                            : 'Cannot create restaurants'}
                        </span>
                      </div>
                      {diagnostics.permissions.error && (
                        <div className="text-red-600 text-sm mt-1">{diagnostics.permissions.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runDiagnostics} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  'Run Diagnostics'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DebugPage;
