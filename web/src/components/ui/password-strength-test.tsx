"use client";

import React, { useState } from "react";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";

export default function PasswordStrengthTest() {
  const [password, setPassword] = useState("");

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Password Strength Indicator Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Password Strength Indicator</h2>
        <input
          type="text"
          placeholder="Enter password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <PasswordStrengthIndicator password={password} />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">With Minimum Strength Requirement</h2>
        <PasswordStrengthIndicator password={password} minStrength={3} />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Without Label</h2>
        <PasswordStrengthIndicator password={password} showLabel={false} />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Predefined Examples</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Very Weak: "pass"</p>
            <PasswordStrengthIndicator password="pass" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Weak: "password123"</p>
            <PasswordStrengthIndicator password="password123" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Fair: "Password123"</p>
            <PasswordStrengthIndicator password="Password123" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Good: "Password123!"</p>
            <PasswordStrengthIndicator password="Password123!" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Strong: "My$tr0ng!P@ssw0rd123"</p>
            <PasswordStrengthIndicator password="My$tr0ng!P@ssw0rd123" />
          </div>
        </div>
      </div>
    </div>
  );
}