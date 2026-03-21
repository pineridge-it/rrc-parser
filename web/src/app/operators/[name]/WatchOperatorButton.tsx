"use client";

import { useState } from "react";
import { toast } from "sonner";

interface WatchOperatorButtonProps {
  operatorName: string;
  workspaceId: string;
  userId: string;
}

export default function WatchOperatorButton({ 
  operatorName, 
  workspaceId,
  userId
}: WatchOperatorButtonProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWatch = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Watch ${operatorName}`,
          trigger_type: 'operator_activity',
          operator_name: operatorName,
          notify_channels: ['email', 'in_app'],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create alert subscription');
      }
      
      const data = await response.json();
      setIsWatching(true);
      toast.success(`Successfully watching ${operatorName} for new permits`);
    } catch (error) {
      console.error('Error creating alert subscription:', error);
      toast.error('Failed to watch operator. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnwatch = async () => {
    if (isLoading) return;
    
    // In a real implementation, we would need to find the existing subscription
    // and delete it. For now, we'll just simulate the unwatch action.
    setIsWatching(false);
    toast.success(`No longer watching ${operatorName}`);
  };

  return (
    <button
      onClick={isWatching ? handleUnwatch : handleWatch}
      disabled={isLoading}
      className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        isWatching
          ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isWatching ? 'Unwatching...' : 'Watching...'}
        </>
      ) : isWatching ? (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Watching
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Watch Operator
        </>
      )}
    </button>
  );
}