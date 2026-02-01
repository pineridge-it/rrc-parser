"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Popover Context
interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(
  undefined
);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used within a Popover");
  }
  return context;
}

// Popover Root
interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Popover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !document.querySelector("[data-popover-content]")?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

// Popover Trigger
interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<
  HTMLElement,
  PopoverTriggerProps & React.HTMLAttributes<HTMLElement>
>(({ children, asChild, ...props }, forwardedRef) => {
  const { setOpen, triggerRef } = usePopover();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    props.onClick?.(e);
    setOpen(true);
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
      onClick: handleClick,
      ref,
    } as any);
  }

  return (
    <button
      ref={ref as any}
      type="button"
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

// Popover Portal
function PopoverPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(children, document.body);
}

import * as ReactDOM from "react-dom";

// Popover Content
interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  avoidCollisions?: boolean;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      side = "bottom",
      sideOffset = 4,
      align = "center",
      alignOffset = 0,
      avoidCollisions = true,
      ...props
    },
    forwardedRef
  ) => {
    const { open, triggerRef } = usePopover();
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
      <PopoverPortal>
        <div
          ref={contentRef}
          data-popover-content
          role="dialog"
          className={cn(
            "z-[var(--z-popover)] w-72 rounded-md border border-[var(--color-border-default)]",
            "bg-[var(--color-surface-raised)] p-4 shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
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
      </PopoverPortal>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

// Popover Close
const PopoverClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { setOpen } = usePopover();

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
});
PopoverClose.displayName = "PopoverClose";

// Popover Anchor
const PopoverAnchor = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return <div ref={ref} {...props} />;
});
PopoverAnchor.displayName = "PopoverAnchor";

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverAnchor,
};
