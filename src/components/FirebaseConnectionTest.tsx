import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const FirebaseConnectionTest = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const testConnection = async () => {
    setStatus('loading');
    setMessage('Testing connection to Firebase...');

    try {
      // Test Firestore connection
      const usersQuery = query(collection(db, 'users'), limit(1));
      await getDocs(usersQuery);

      // If we get here, the connection was successful
      setStatus('success');
      setMessage('Successfully connected to Firebase!');
    } catch (error) {
      console.error('Firebase connection error:', error);
      setStatus('error');
      setMessage(`Failed to connect to Firebase: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Alert
      variant={status === 'error' ? 'destructive' : status === 'success' ? 'default' : 'outline'}
      className="mb-4"
    >
      <div className="flex items-center">
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
        {status === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
        <AlertTitle>
          {status === 'loading' && 'Testing Firebase Connection'}
          {status === 'success' && 'Firebase Connected'}
          {status === 'error' && 'Firebase Connection Error'}
          {status === 'idle' && 'Firebase Connection Status'}
        </AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        {message}
        {status === 'error' && (
          <div className="mt-2">
            <Button size="sm" onClick={testConnection} variant="outline">
              Retry Connection
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default FirebaseConnectionTest;
