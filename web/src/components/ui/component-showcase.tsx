"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Badge,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
} from "./index";
import { Info, Settings, User, Bell, Check, X } from "lucide-react";

/**
 * Component Showcase
 *
 * A development component that demonstrates all UI components
 * in the component library. Use this for testing and documentation.
 */

export function ComponentShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Component Library Showcase
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          A comprehensive showcase of all available UI components.
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button state="loading">Loading</Button>
          <Button state="success">Success</Button>
          <Button state="error">Error</Button>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>
                This is a card description that provides additional context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-text-secondary)]">
                Card content goes here. You can put any content inside the card.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Action</Button>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-primary)] flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    User Profile
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Manage your account settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dialog */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Dialog
        </h2>
        <div className="flex gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog description. Dialogs are used for important
                  information or actions that require user attention.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-[var(--color-text-secondary)]">
                  Dialog content goes here. You can include forms, text, or any
                  other content.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Tooltip */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Tooltip
        </h2>
        <div className="flex gap-8 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a tooltip</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[var(--color-text-primary)] cursor-help border-b border-dashed">
                Hover for tooltip
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Tooltip on bottom</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Tooltip on right</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </section>

      {/* Popover */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Popover
        </h2>
        <div className="flex gap-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">
                  Settings
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Notifications
                    </span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Dark Mode
                    </span>
                    <Switch />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setPopoverOpen(false)}>
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <h4 className="font-medium text-[var(--color-text-primary)]">
                  Notifications
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  You have 3 unread notifications.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Badges
        </h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      {/* Form Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Form Components
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Input
            </label>
            <Input placeholder="Enter text..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Select
            </label>
            <Select
              options={[
                { value: "1", label: "Option 1" },
                { value: "2", label: "Option 2" },
                { value: "3", label: "Option 3" },
              ]}
              placeholder="Select an option"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Textarea
            </label>
            <Textarea placeholder="Enter longer text..." />
          </div>

          <div className="flex items-center gap-4">
            <Checkbox id="checkbox" />
            <label
              htmlFor="checkbox"
              className="text-sm text-[var(--color-text-primary)]"
            >
              Checkbox option
            </label>
          </div>

          <div className="flex items-center gap-4">
            <Switch id="switch" />
            <label
              htmlFor="switch"
              className="text-sm text-[var(--color-text-primary)]"
            >
              Toggle switch
            </label>
          </div>
        </div>
      </section>

      {/* Component Status */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Component Library Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Button", status: "Complete", icon: Check },
            { name: "Card", status: "Complete", icon: Check },
            { name: "Dialog", status: "Complete", icon: Check },
            { name: "Tooltip", status: "Complete", icon: Check },
            { name: "Popover", status: "Complete", icon: Check },
            { name: "Badge", status: "Complete", icon: Check },
            { name: "Input", status: "Complete", icon: Check },
            { name: "Textarea", status: "Complete", icon: Check },
            { name: "Select", status: "Complete", icon: Check },
            { name: "Checkbox", status: "Complete", icon: Check },
            { name: "Radio", status: "Complete", icon: Check },
            { name: "Switch", status: "Complete", icon: Check },
          ].map((component) => (
            <div
              key={component.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-subtle)]"
            >
              <component.icon className="w-4 h-4 text-[var(--color-success)]" />
              <span className="font-medium text-[var(--color-text-primary)]">
                {component.name}
              </span>
              <Badge variant="neutral" className="ml-auto text-xs">
                {component.status}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
