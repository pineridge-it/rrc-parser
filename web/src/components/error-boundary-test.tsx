"use client";

import React, { useState } from "react";
import { AppErrorBoundary, SectionErrorBoundary, CardErrorBoundary } from "@/components/error-boundary";

// Component that throws an error for testing
const BuggyComponent = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  if (shouldThrow) {
    throw new Error("This is a test error!");
  }
  
  return (
    <div className="p-4 bg-surface-subtle rounded">
      <h3 className="font-medium text-text-primary mb-2">Buggy Component</h3>
      <p className="text-text-secondary mb-4">This component will throw an error when you click the button.</p>
      <button 
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Trigger Error
      </button>
    </div>
  );
};

export default function ErrorBoundaryTest() {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Error Boundary Test</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">App Error Boundary</h2>
        <AppErrorBoundary>
          <div className="space-y-4">
            <p>This content is wrapped in an AppErrorBoundary.</p>
            <BuggyComponent />
          </div>
        </AppErrorBoundary>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Section Error Boundary</h2>
        <SectionErrorBoundary>
          <div className="space-y-4">
            <p>This content is wrapped in a SectionErrorBoundary.</p>
            <BuggyComponent />
          </div>
        </SectionErrorBoundary>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Card Error Boundary</h2>
        <CardErrorBoundary>
          <div className="space-y-4">
            <p>This content is wrapped in a CardErrorBoundary.</p>
            <BuggyComponent />
          </div>
        </CardErrorBoundary>
      </div>
    </div>
  );
}