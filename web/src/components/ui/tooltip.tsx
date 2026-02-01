"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Tooltip Context
interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(
  undefined
);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip");
  }
  return context;
}

// Tooltip Provider
interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

function TooltipProvider({
  children,
  delayDuration = 200,
  skipDelayDuration = 300,
}: TooltipProviderProps) {
  // Provider can be used to set global tooltip settings
  return <>{children}</>;
}

// Tooltip Root
interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

function Tooltip({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 200,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (value) {
        timeoutRef.current = setTimeout(() => {
          if (!isControlled) {
            setUncontrolledOpen(true);
          }
          onOpenChange?.(true);
        }, delayDuration);
      } else {
        if (!isControlled) {
          setUncontrolledOpen(false);
        }
        onOpenChange?.(false);
      }
    },
    [isControlled, onOpenChange, delayDuration]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

// Tooltip Trigger
interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  TooltipTriggerProps & React.HTMLAttributes<HTMLElement>
>(({ children, asChild, ...props }, forwardedRef) => {
  const { setOpen, triggerRef } = useTooltip();

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    (props.onMouseEnter as React.MouseEventHandler<HTMLElement>)?.(e);
    setOpen(true);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    (props.onMouseLeave as React.MouseEventHandler<HTMLElement>)?.(e);
    setOpen(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    (props.onFocus as React.FocusEventHandler<HTMLElement>)?.(e);
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    (props.onBlur as React.FocusEventHandler<HTMLElement>)?.(e);
    setOpen(false);
  };

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [forwardedRef, triggerRef]
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      ref,
    } as any);
  }

  return (
    <span
      ref={ref as any}
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </span>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

// Tooltip Portal
function TooltipPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(children, document.body);
}

import * as ReactDOM from "react-dom";

// Tooltip Content
interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  avoidCollisions?: boolean;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      side = "top",
      sideOffset = 4,
      align = "center",
      alignOffset = 0,
      avoidCollisions = true,
      ...props
    },
    forwardedRef
  ) => {
    const { open, triggerRef } = useTooltip();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useImperativeHandle(forwardedRef, () => contentRef.current!);

    // Calculate position
    React.useEffect(() => {
      if (!open || !triggerRef.current || !contentRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Calculate position based on side
      switch (side) {
        case "top":
          top = triggerRect.top - contentRect.height - sideOffset;
          break;
        case "bottom":
          top = triggerRect.bottom + sideOffset;
          break;
        case "left":
          left = triggerRect.left - contentRect.width - sideOffset;
          break;
        case "right":
          left = triggerRect.right + sideOffset;
          break;
      }

      // Calculate position based on alignment for top/bottom
      if (side === "top" || side === "bottom") {
        switch (align) {
          case "start":
            left = triggerRect.left + alignOffset;
            break;
          case "center":
            left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
            break;
          case "end":
            left = triggerRect.right - contentRect.width - alignOffset;
            break;
        }
      }

      // Calculate position based on alignment for left/right
      if (side === "left" || side === "right") {
        switch (align) {
          case "start":
            top = triggerRect.top + alignOffset;
            break;
          case "center":
            top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
            break;
          case "end":
            top = triggerRect.bottom - contentRect.height - alignOffset;
            break;
        }
      }

      // Collision detection
      if (avoidCollisions) {
        const padding = 8;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < padding) left = padding;
        if (left + contentRect.width > viewportWidth - padding) {
          left = viewportWidth - contentRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + contentRect.height > viewportHeight - padding) {
          top = viewportHeight - contentRect.height - padding;
        }
      }

      setPosition({ top, left });
    }, [open, side, sideOffset, align, alignOffset, avoidCollisions, triggerRef]);

    if (!open) return null;

    return (
      <TooltipPortal>
        <div
          ref={contentRef}
          role="tooltip"
          className={cn(
            "z-[var(--z-tooltip)] px-3 py-1.5 text-sm",
            "bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)]",
            "rounded-md shadow-md border border-[var(--color-border-default)]",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
          }}
          data-side={side}
          data-state={open ? "open" : "closed"}
          {...props}
        />
      </TooltipPortal>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

// Tooltip Arrow
interface TooltipArrowProps extends React.SVGProps<SVGSVGElement> {
  side?: "top" | "bottom" | "left" | "right";
}

const TooltipArrow = React.forwardRef<SVGSVGElement, TooltipArrowProps>(
  ({ className, side = "top", ...props }, ref) => {
    const rotation = {
      top: 180,
      bottom: 0,
      left: 90,
      right: -90,
    }[side];

    return (
      <svg
        ref={ref}
        width="10"
        height="5"
        viewBox="0 0 30 10"
        preserveAspectRatio="none"
        className={cn("fill-[var(--color-surface-overlay)]", className)}
        style={{ transform: `rotate(${rotation}deg)` }}
        {...props}
      >
        <polygon points="0,0 30,0 15,10" />
      </svg>
    );
  }
);
TooltipArrow.displayName = "TooltipArrow";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
};
