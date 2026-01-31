"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function TextareaTest() {
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Textarea Component Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Textarea</h2>
        <Textarea 
          placeholder="Enter text..." 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Textarea with Auto-resize</h2>
        <Textarea 
          placeholder="Enter text... This textarea will automatically resize as you type more content." 
          autoResize
          value={value2} 
          onChange={(e) => setValue2(e.target.value)} 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Textarea with Character Count</h2>
        <Textarea 
          placeholder="Enter text..." 
          maxLength={200}
          showCharacterCount
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Textarea with Label and Helper Text</h2>
        <Textarea
          label="Description"
          helperText="Please provide a detailed description of your issue"
          placeholder="Enter a detailed description..."
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Textarea with Floating Label</h2>
        <Textarea
          label="Comments"
          placeholder="Enter your comments..."
          floatingLabel
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Textarea with Error State</h2>
        <Textarea
          label="Description"
          error="Description is required"
          placeholder="Enter a detailed description..." 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Textarea with Success State</h2>
        <Textarea 
          label="Description" 
          success="Description looks good!"
          placeholder="Enter a detailed description..." 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Disabled Textarea</h2>
        <Textarea 
          label="Description" 
          placeholder="Enter a detailed description..." 
          disabled
          value="This textarea is disabled"
        />
      </div>
    </div>
  );
}