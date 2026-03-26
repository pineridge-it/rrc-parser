/**
 * UI Component Library
 * 
 * A comprehensive component library with reusable UI elements.
 * Each component is accessible, customizable, and follows design system conventions.
 * 
 * @example
 * // Import individual components
 * import { Button, Card, Dialog, Input } from '@/components/ui';
 * 
 * @example
 * // Import specific variants
 * import { buttonVariants, inputVariants } from '@/components/ui';
 */

// Core components
export { Button, buttonVariants } from './button';
export type { ButtonProps, ButtonState } from './button';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

export { Input, inputVariants } from './input';
export type { InputProps } from './input';

export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

// Form components
export { Checkbox } from './checkbox';
export type { CheckboxProps } from './checkbox';

export { Radio, RadioGroup } from './radio';
export type { RadioProps, RadioGroupProps } from './radio';

export { Select, SelectOption } from './select';
export type { SelectProps, SelectOptionProps } from './select';

export { Switch } from './switch';
export type { SwitchProps } from './switch';

// Feedback components
export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

export { Skeleton } from './skeleton';
export type { SkeletonProps } from './skeleton';

export { 
  Toast, 
  ToastProvider, 
  ToastViewport, 
  useToast 
} from './toast';
export type { ToastProps } from './toast';

// Overlay components
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

// Navigation components
export { 
  Sidebar, 
  SidebarProvider, 
  SidebarLayout, 
  MobileMenuButton,
  useSidebar,
  defaultNavItems,
} from './sidebar';
export type { SidebarProps, NavItem, SidebarLayoutProps } from './sidebar';

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from './breadcrumb';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export type { TabsProps } from './tabs';

// Data display components
export { DataTable } from './data-table';
export type { DataTableProps, Column } from './data-table';

export { CommandPalette, useCommandPalette } from './command-palette';
export type { CommandPaletteProps, CommandItem } from './command-palette';

// Utility components
export { ErrorBoundary } from './error-boundary';
export type { ErrorBoundaryProps } from './error-boundary';

export { SkipLink } from './skip-link';
export type { SkipLinkProps } from './skip-link';

export { FileUpload } from './file-upload';
export type { FileUploadProps, FileUploadFile } from './file-upload';

export { PasswordStrength } from './password-strength';
export type { PasswordStrengthProps } from './password-strength';

// Animation components
export { 
  FadeIn, 
  SlideIn, 
  ScaleIn, 
  StaggerChildren,
  AnimatedList,
  AnimatedCounter,
} from './animated';

// Keyboard shortcuts
export { KeyboardShortcuts } from './keyboard-shortcuts';
export type { KeyboardShortcutsProps, ShortcutDefinition } from './keyboard-shortcuts';

export { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';

export { 
  KeyboardShortcutsProvider, 
  useKeyboardShortcuts 
} from './keyboard-shortcuts-provider';

// Performance components
export { VirtualScroll } from './virtual-scroll';
export type { VirtualScrollProps } from './virtual-scroll';

export { VirtualList } from './virtual-list';
export type { VirtualListProps } from './virtual-list';

export { LazyLoad } from './lazy-load';
export type { LazyLoadProps } from './lazy-load';

export { OptimizedImage } from './optimized-image';
export type { OptimizedImageProps } from './optimized-image';

// Theme
export { ThemeProvider, useTheme } from './theme-provider';
export type { ThemeProviderProps } from './theme-provider';

// Design tokens
export { designTokens, cssVariables } from './design-tokens';

// Component showcase (for development/documentation)
export { ComponentShowcase } from './component-showcase';
