"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function SwitchTest() {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(true);
  const [checked3, setChecked3] = useState(false);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Switch Component Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Switch</h2>
        <Switch 
          label="Enable notifications"
          checked={checked1}
          onChange={(e) => setChecked1(e.target.checked)}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Switch with Helper Text</h2>
        <Switch 
          label="Enable dark mode"
          helperText="Changes the appearance of the application"
          checked={checked2}
          onChange={(e) => setChecked2(e.target.checked)}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Switch with Error State</h2>
        <Switch 
          label="Accept terms and conditions"
          error="You must accept the terms and conditions"
          checked={checked3}
          onChange={(e) => setChecked3(e.target.checked)}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Disabled Switch</h2>
        <Switch 
          label="Auto-save drafts"
          checked={true}
          disabled
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Required Switch</h2>
        <Switch 
          label="Agree to marketing emails"
          required
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Label Position Left</h2>
        <Switch 
          label="Email notifications"
          labelPosition="left"
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Size Variants</h2>
        <div className="space-y-4">
          <Switch 
            label="Small switch"
            size="sm"
          />
          <Switch 
            label="Medium switch"
            size="md"
          />
          <Switch 
            label="Large switch"
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}