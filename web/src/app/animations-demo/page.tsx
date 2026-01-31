"use client";

import { useState } from "react";
import {
  AnimatedContainer,
  AnimatedList,
  AnimatedButton,
  AnimatedCard,
  AnimatedModal,
  AnimatedPage,
  FadeInView,
  Skeleton,
  Spinner,
  Shake,
} from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

/**
 * Animations Demo Page
 * 
 * Demonstrates all animation components and micro-interactions.
 */
export default function AnimationsDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [animation, setAnimation] = useState("fade");

  const demoItems = [
    "Item 1 with stagger animation",
    "Item 2 with stagger animation",
    "Item 3 with stagger animation",
    "Item 4 with stagger animation",
  ];

  return (
    <AnimatedPage className="min-h-screen p-8 bg-[var(--color-surface-default)]">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Micro-interactions & Animation System
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Comprehensive animation library with reduced motion support.
          </p>
        </div>

        {/* Container Animations */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Container Animations
          </h2>
          <div className="flex flex-wrap gap-3">
            {["fade", "fadeUp", "fadeDown", "scale", "pop"].map((anim) => (
              <Button
                key={anim}
                variant={animation === anim ? "primary" : "secondary"}
                onClick={() => setAnimation(anim)}
              >
                {anim}
              </Button>
            ))}
          </div>
          <AnimatedContainer
            animation={animation as any}
            className="p-6 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border-default)]"
          >
            <p className="text-[var(--color-text-primary)]">
              This container animates with the "{animation}" animation.
            </p>
          </AnimatedContainer>
        </section>

        {/* Stagger List */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Stagger List Animation
          </h2>
          <AnimatedList className="space-y-2" staggerDelay={0.1}>
            {demoItems.map((item, i) => (
              <div
                key={i}
                className="p-4 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border-default)]"
              >
                <p className="text-[var(--color-text-primary)]">{item}</p>
              </div>
            ))}
          </AnimatedList>
        </section>

        {/* Interactive Elements */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Interactive Micro-interactions
          </h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg">
              Hover & Tap Me
            </AnimatedButton>
            <AnimatedCard
              className="p-4 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border-default)] cursor-pointer"
              hover
              tap
            >
              <p className="text-[var(--color-text-primary)]">Hover/Tap Card</p>
            </AnimatedCard>
          </div>
        </section>

        {/* Modal */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Modal Animation
          </h2>
          <Button onClick={() => setShowModal(true)}>Open Modal</Button>
          <AnimatedModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            className="bg-[var(--color-surface-raised)] p-6 rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Animated Modal
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              This modal uses spring animations for smooth entrance and exit.
            </p>
            <Button onClick={() => setShowModal(false)}>Close</Button>
          </AnimatedModal>
        </section>

        {/* Scroll Animations */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Scroll-triggered Animations
          </h2>
          <div className="space-y-4">
            {["up", "down", "left", "right"].map((direction) => (
              <FadeInView
                key={direction}
                direction={direction as any}
                className="p-4 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border-default)]"
              >
                <p className="text-[var(--color-text-primary)]">
                  Fade in {direction} (scroll to see)
                </p>
              </FadeInView>
            ))}
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Loading States
          </h2>
          <div className="flex flex-wrap gap-8 items-center">
            <div className="space-y-2">
              <p className="text-sm text-[var(--color-text-secondary)]">Pulse Skeleton</p>
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-32 h-4" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[var(--color-text-secondary)]">Shimmer Skeleton</p>
              <Skeleton variant="shimmer" className="w-48 h-4" />
              <Skeleton variant="shimmer" className="w-32 h-4" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[var(--color-text-secondary)]">Spinners</p>
              <div className="flex gap-2">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Shake Animation */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Shake Animation (Error State)
          </h2>
          <Shake trigger={shakeTrigger} onShakeEnd={() => setShakeTrigger(false)}>
            <div className="p-4 bg-[var(--color-error-subtle)] border border-[var(--color-error)] rounded-lg inline-block">
              <p className="text-[var(--color-error)]">This element shakes on error</p>
            </div>
          </Shake>
          <Button
            variant="destructive"
            onClick={() => setShakeTrigger(true)}
          >
            Trigger Shake
          </Button>
        </section>

        {/* Framer Motion Direct Usage */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Direct Framer Motion Usage
          </h2>
          <div className="flex flex-wrap gap-4">
            <motion.div
              className="w-20 h-20 bg-[var(--color-brand-primary)] rounded-lg"
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <motion.div
              className="w-20 h-20 bg-[var(--color-success)] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
            <motion.div
              className="w-20 h-20 bg-[var(--color-warning)] rounded-lg"
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
              whileDrag={{ scale: 1.1 }}
            />
          </div>
        </section>

        {/* Reduced Motion Support */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Accessibility: Reduced Motion
          </h2>
          <div className="p-4 bg-[var(--color-info-subtle)] border border-[var(--color-info)] rounded-lg">
            <p className="text-[var(--color-info)]">
              All animations respect the user's "prefers-reduced-motion" 
              setting. When enabled, animations are instant or disabled entirely.
            </p>
          </div>
        </section>

        {/* Usage Example */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Usage Example
          </h2>
          <pre className="p-4 rounded-lg bg-[var(--color-surface-subtle)] overflow-x-auto text-sm">
            <code>{`import { 
  AnimatedContainer, 
  AnimatedList,
  AnimatedButton,
  FadeInView 
} from "@/components/ui/animated";

// Simple animated container
<AnimatedContainer animation="fadeUp">
  <p>Content fades in</p>
</AnimatedContainer>

// Staggered list
<AnimatedList staggerDelay={0.1}>
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</AnimatedList>

// Scroll-triggered animation
<FadeInView direction="up">
  <p>Appears when scrolled into view</p>
</FadeInView>

// Interactive button
<AnimatedButton className="btn-primary">
  Click me
</AnimatedButton>`}</code>
          </pre>
        </section>
      </div>
    </AnimatedPage>
  );
}
