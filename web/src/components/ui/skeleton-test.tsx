"use client";

import { 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonText, 
  SkeletonForm 
} from "@/components/ui/skeleton";

export default function SkeletonTest() {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Skeleton Component Test</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Skeleton Card</h2>
        <SkeletonCard className="max-w-md" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Skeleton Table</h2>
        <SkeletonTable rows={3} columns={4} className="max-w-2xl" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Skeleton Text</h2>
        <div className="space-y-4 max-w-2xl">
          <SkeletonText variant="h1" width="80%" />
          <SkeletonText variant="h2" width="90%" />
          <SkeletonText variant="p" lines={3} width="95%" />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Skeleton Form</h2>
        <SkeletonForm fields={4} className="max-w-md" />
      </div>
    </div>
  );
}