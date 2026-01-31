"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, User, Lock, Mail } from "lucide-react";

export default function InputTest() {
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Input Component Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Input</h2>
        <Input 
          placeholder="Enter text..." 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Left Icon</h2>
        <Input 
          placeholder="Search..." 
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Right Icon</h2>
        <Input 
          placeholder="Enter username..." 
          rightIcon={<User className="w-4 h-4" />}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Both Icons</h2>
        <Input 
          placeholder="Enter email..." 
          leftIcon={<Mail className="w-4 h-4" />}
          rightIcon={<User className="w-4 h-4" />}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Clearable Input</h2>
        <Input 
          placeholder="Enter text..." 
          clearable 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Password Input</h2>
        <Input 
          type="password" 
          placeholder="Enter password..." 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Label</h2>
        <Input 
          label="Full Name" 
          placeholder="Enter your full name..." 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Floating Label</h2>
        <Input 
          label="Email Address" 
          placeholder="your.email@example.com" 
          floatingLabel 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Helper Text</h2>
        <Input 
          label="Username" 
          placeholder="Enter username..." 
          helperText="Username must be at least 3 characters long" 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Error State</h2>
        <Input 
          label="Email" 
          placeholder="Enter email..." 
          error="Please enter a valid email address" 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input with Success State</h2>
        <Input 
          label="Password" 
          type="password" 
          placeholder="Enter password..." 
          success="Password strength: Strong" 
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Size Variants</h2>
        <div className="space-y-3">
          <Input 
            placeholder="Small input" 
            size="sm" 
          />
          <Input 
            placeholder="Medium input" 
            size="md" 
          />
          <Input 
            placeholder="Large input" 
            size="lg" 
          />
        </div>
      </div>
    </div>
  );
}