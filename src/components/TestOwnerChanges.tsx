import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testCreateVerifiedOwner, testCreatePendingOwner, testGetRestaurantOwners } from '../test-owner-changes';

const TestOwnerChanges = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults('Running tests...\n');

    try {
      // Redirect console.log to our results
      const originalConsoleLog = console.log;
      const logs: string[] = [];
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
        setTestResults(logs.join('\n'));
      };

      // Run the tests
      await testGetRestaurantOwners();
      
      // Restore console.log
      console.log = originalConsoleLog;
    } catch (error) {
      setTestResults(prev => `${prev}\nError: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Restaurant Owner Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Running Tests...' : 'Run Tests'}
            </Button>
            
            {testResults && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Test Results:</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {testResults}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestOwnerChanges;
