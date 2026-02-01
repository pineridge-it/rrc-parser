"use client";

import { useState, useCallback, useRef } from "react";

export type OptimisticState<T> = {
  data: T;
  status: "idle" | "pending" | "success" | "error";
  error?: Error;
};

export interface UseOptimisticOptions<T> {
  onError?: (error: Error, previousData: T) => void;
  onSuccess?: (data: T) => void;
  rollbackOnError?: boolean;
}

/**
 * Hook for implementing optimistic UI updates
 * Updates UI immediately while the request is in flight
 * Rolls back on error if configured
 */
export function useOptimistic<T>(
  initialData: T,
  options: UseOptimisticOptions<T> = {}
) {
  const { onError, onSuccess, rollbackOnError = true } = options;
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    status: "idle",
  });
  const previousDataRef = useRef<T>(initialData);

  const execute = useCallback(
    async (
      optimisticData: T,
      asyncOperation: () => Promise<T>
    ): Promise<void> => {
      // Store previous data for potential rollback
      previousDataRef.current = state.data;

      // Optimistically update UI
      setState({
        data: optimisticData,
        status: "pending",
      });

      try {
        const result = await asyncOperation();

        setState({
          data: result,
          status: "success",
        });

        onSuccess?.(result);
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (rollbackOnError) {
          setState({
            data: previousDataRef.current,
            status: "error",
            error: errorObj,
          });
        } else {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: errorObj,
          }));
        }

        onError?.(errorObj, previousDataRef.current);
      }
    },
    [state.data, onError, onSuccess, rollbackOnError]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      status: "idle",
    });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState((prev) => ({
      ...prev,
      data,
    }));
  }, []);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    execute,
    reset,
    setData,
  };
}

/**
 * Hook for optimistic list operations (add, remove, update)
 */
export function useOptimisticList<T extends { id: string }>(
  initialList: T[] = [],
  options: UseOptimisticOptions<T[]> = {}
) {
  const optimistic = useOptimistic<T[]>(initialList, options);

  const addItem = useCallback(
    async (
      item: Omit<T, "id"> & Partial<Pick<T, "id">>,
      asyncOperation: (item: T) => Promise<T>
    ) => {
      const tempId = item.id || crypto.randomUUID();
      const optimisticItem = { ...item, id: tempId } as T;
      const newList = [...optimistic.data, optimisticItem];

      await optimistic.execute(newList, async () => {
        const result = await asyncOperation(optimisticItem);
        // Replace temp item with real one
        return optimistic.data.map((i) =>
          i.id === tempId ? result : i
        );
      });
    },
    [optimistic]
  );

  const removeItem = useCallback(
    async (id: string, asyncOperation: (id: string) => Promise<void>) => {
      const newList = optimistic.data.filter((item) => item.id !== id);

      await optimistic.execute(newList, async () => {
        await asyncOperation(id);
        return newList;
      });
    },
    [optimistic]
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<T>,
      asyncOperation: (id: string, updates: Partial<T>) => Promise<T>
    ) => {
      const newList = optimistic.data.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );

      await optimistic.execute(newList, async () => {
        const result = await asyncOperation(id, updates);
        return optimistic.data.map((item) =>
          item.id === id ? result : item
        );
      });
    },
    [optimistic]
  );

  return {
    ...optimistic,
    addItem,
    removeItem,
    updateItem,
  };
}
