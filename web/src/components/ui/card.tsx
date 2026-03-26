/**
 * @fileoverview Card Component
 * 
 * A container component for displaying content in a styled card format.
 * Composed of Card, CardHeader, CardTitle, CardDescription, CardContent, and CardFooter.
 * 
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * 
 * @module components/ui/card
 */

import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Card container component.
 * Renders a styled div with border, background, and shadow.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML div attributes
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * Card header component.
 * Contains the title and description with proper spacing.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML div attributes
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Card title component.
 * Renders an h3 heading with large, semibold text.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML heading attributes
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Card description component.
 * Renders a muted paragraph for card descriptions.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML paragraph attributes
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-text-secondary)]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Card content component.
 * The main content area of the card.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML div attributes
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * Card footer component.
 * Typically used for action buttons.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML div attributes
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
