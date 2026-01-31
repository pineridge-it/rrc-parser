"use client";

import { useToast } from "@/components/ui/use-toast";

export default function ToastTest() {
  const { success, error, warning, info } = useToast();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Toast Test</h2>
      <div className="space-x-2">
        <button 
          onClick={() => success("Success!", { description: "This is a success message" })}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Success Toast
        </button>
        <button 
          onClick={() => error("Error!", { description: "This is an error message" })}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Error Toast
        </button>
        <button 
          onClick={() => warning("Warning!", { description: "This is a warning message" })}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Warning Toast
        </button>
        <button 
          onClick={() => info("Info!", { description: "This is an info message" })}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Info Toast
        </button>
      </div>
    </div>
  );
}