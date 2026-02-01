"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  blurDataURL?: string;
  placeholder?: "blur" | "empty";
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  containerClassName,
  priority = false,
  blurDataURL,
  placeholder = "blur",
  sizes,
  quality = 75,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate a simple blur data URL if not provided
  const defaultBlurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjFmMSIvPjwvc3ZnPg==";

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100",
          fill ? "absolute inset-0" : "",
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "absolute inset-0" : "",
        containerClassName
      )}
      style={!fill ? { width, height } : undefined}
    >
      {/* Blur placeholder */}
      {!isLoaded && placeholder === "blur" && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: `url(${blurDataURL || defaultBlurDataURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px)",
          }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        sizes={sizes}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}

// Hook for generating blur data URL from an image
export function useBlurDataURL(src: string) {
  const [blurDataURL, setBlurDataURL] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const generateBlurDataURL = async () => {
      try {
        // For external images, we can't easily generate blur data
        // In production, this should be done at build time or via an API
        if (src.startsWith("http")) {
          setBlurDataURL(undefined);
          return;
        }

        // For local images, we could use sharp or similar
        // This is a simplified version
        setBlurDataURL(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    generateBlurDataURL();
  }, [src]);

  return { blurDataURL, isLoading };
}

// Skeleton image loader component
interface ImageSkeletonProps {
  width?: number;
  height?: number;
  className?: string;
}

export function ImageSkeleton({ width, height, className }: ImageSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-200 animate-pulse rounded",
        className
      )}
      style={{ width, height }}
    />
  );
}
