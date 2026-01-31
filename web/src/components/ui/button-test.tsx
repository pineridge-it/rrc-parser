"use client";

import React, { useState } from "react";
import { Button } from "./button";
import { Loader2, Check, X, ArrowRight, Mail } from "lucide-react";

export function ButtonTest() {
  const [loadingState, setLoadingState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const simulateAction = async () => {
    setLoadingState("loading");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoadingState("success");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingState("idle");
  };

  const simulateError = async () => {
    setLoadingState("loading");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingState("error");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingState("idle");
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Button Component Test</h1>

      {/* Variant Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Size Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="secondary">
            <Mail />
          </Button>
        </div>
      </section>

      {/* States Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">States</h2>
        <div className="flex flex-wrap gap-4">
          <Button state="idle">Idle</Button>
          <Button state="loading">Loading</Button>
          <Button state="success">Success</Button>
          <Button state="error">Error</Button>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Interactive Demo</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            state={loadingState}
            onClick={simulateAction}
            loadingText="Processing..."
            successText="Done!"
          >
            Simulate Success
          </Button>
          <Button
            variant="secondary"
            state={loadingState}
            onClick={simulateError}
            loadingText="Processing..."
            errorText="Failed!"
          >
            Simulate Error
          </Button>
        </div>
      </section>

      {/* With Icons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">With Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<Mail />}>Email</Button>
          <Button rightIcon={<ArrowRight />}>Next</Button>
          <Button leftIcon={<Mail />} rightIcon={<ArrowRight />}>
            Both Icons
          </Button>
        </div>
      </section>

      {/* Disabled State */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Disabled</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled</Button>
          <Button disabled variant="secondary">
            Disabled Secondary
          </Button>
        </div>
      </section>
    </div>
  );
}
