"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Upload, X, File, FileText, Image, Music, Video, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// File upload variants
const fileUploadVariants = cva(
  "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg transition-colors cursor-pointer",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)]",
        dragover: "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10",
        error: "border-[var(--color-error)] bg-[var(--color-error)]/10",
        success: "border-[var(--color-success)] bg-[var(--color-success)]/10",
      },
      size: {
        sm: "min-h-[120px] p-4",
        md: "min-h-[160px] p-6",
        lg: "min-h-[200px] p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// File info type
export interface FileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress?: number;
  status?: "pending" | "uploading" | "success" | "error";
  error?: string;
}

// File upload props
export interface FileUploadProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange">,
    VariantProps<typeof fileUploadVariants> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  label?: string;
  description?: string;
  error?: string;
  files?: FileInfo[];
  onFilesChange?: (files: FileInfo[]) => void;
  onFileRemove?: (fileId: string) => void;
  onUpload?: (files: FileInfo[]) => void;
  showFileList?: boolean;
  disabled?: boolean;
  className?: string;
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper to get file icon
function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("pdf") || type.includes("text")) return FileText;
  return File;
}

// File upload component
const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      label = "Upload files",
      description = "Drag and drop files here, or click to select files",
      error,
      files = [],
      onFilesChange,
      onFileRemove,
      onUpload,
      showFileList = true,
      disabled = false,
      size = "md",
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string | null>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const uploadId = id || React.useId();

    const validateFiles = (fileList: FileList): FileInfo[] => {
      const newFiles: FileInfo[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        // Check file size
        if (maxSize && file.size > maxSize) {
          errors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
          return;
        }

        // Check file type
        if (accept) {
          const acceptedTypes = accept.split(",").map((t) => t.trim());
          const isAccepted = acceptedTypes.some((type) => {
            if (type.includes("*")) {
              return file.type.startsWith(type.replace("/*", ""));
            }
            return file.type === type;
          });
          if (!isAccepted) {
            errors.push(`${file.name} is not an accepted file type`);
            return;
          }
        }

        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "pending",
        });
      });

      // Check max files
      if (maxFiles && files.length + newFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return [];
      }

      if (errors.length > 0) {
        setInternalError(errors.join("; "));
      } else {
        setInternalError(null);
      }

      return newFiles;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const newFiles = validateFiles(fileList);
      if (newFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
        onFilesChange?.(updatedFiles);
        onUpload?.(newFiles);
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const fileList = e.dataTransfer.files;
      if (!fileList || fileList.length === 0) return;

      const newFiles = validateFiles(fileList);
      if (newFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
        onFilesChange?.(updatedFiles);
        onUpload?.(newFiles);
      }
    };

    const handleRemove = (fileId: string) => {
      const updatedFiles = files.filter((f) => f.id !== fileId);
      onFilesChange?.(updatedFiles);
      onFileRemove?.(fileId);
    };

    const displayError = error || internalError;
    const currentVariant = displayError
      ? "error"
      : isDragOver
      ? "dragover"
      : files.length > 0 && files.every((f) => f.status === "success")
      ? "success"
      : "default";

    return (
      <div className={cn("space-y-4", className)}>
        {/* Upload area */}
        <div
          className={cn(fileUploadVariants({ variant: currentVariant, size }))}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            id={uploadId}
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
            className="sr-only"
            {...props}
          />

          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div
              className={cn(
                "p-3 rounded-full",
                currentVariant === "dragover"
                  ? "bg-[var(--color-brand-primary)]/20"
                  : currentVariant === "error"
                  ? "bg-[var(--color-error)]/20"
                  : currentVariant === "success"
                  ? "bg-[var(--color-success)]/20"
                  : "bg-[var(--color-surface-hover)]"
              )}
            >
              {currentVariant === "success" ? (
                <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
              ) : currentVariant === "error" ? (
                <AlertCircle className="w-6 h-6 text-[var(--color-error)]" />
              ) : (
                <Upload className="w-6 h-6 text-[var(--color-text-secondary)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {label}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {description}
              </p>
              {maxSize && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Max size: {formatFileSize(maxSize)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {displayError && (
          <p className="text-sm text-[var(--color-error)] flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {displayError}
          </p>
        )}

        {/* File list */}
        {showFileList && files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border-default)]"
                >
                  <div className="p-2 bg-[var(--color-surface-hover)] rounded">
                    <FileIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {file.status === "uploading" && file.progress !== undefined && (
                    <div className="w-20">
                      <div className="h-1.5 bg-[var(--color-border-default)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-brand-primary)] transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] text-right mt-1">
                        {file.progress}%
                      </p>
                    </div>
                  )}
                  {file.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-[var(--color-error)]" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(file.id)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
