/**
 * Export Hook for Data Export System
 * Manages export creation, status tracking, and download
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  ExportRequest, 
  ExportJob, 
  ExportFormat, 
  ExportStatus,
  EXPORT_FORMATS,
  EXPORT_FIELDS,
  getExportFormatConfig 
} from '@/types/export';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UseExportOptions {
  workspaceId: string;
}

interface UseExportReturn {
  // State
  jobs: ExportJob[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  
  // Actions
  createExport: (request: Omit<ExportRequest, 'workspaceId'>) => Promise<ExportJob | null>;
  refreshJobs: () => Promise<void>;
  cancelExport: (jobId: string) => Promise<boolean>;
  downloadExport: (job: ExportJob) => void;
  
  // Helpers
  getAvailableFormats: () => typeof EXPORT_FORMATS;
  getAvailableFields: () => typeof EXPORT_FIELDS;
  supportsGeometry: (format: ExportFormat) => boolean;
}

export function useExport({ workspaceId }: UseExportOptions): UseExportReturn {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  /**
   * Fetch export jobs for the workspace
   */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/exports`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exports: ${response.statusText}`);
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exports');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  /**
   * Create a new export job
   */
  const createExport = useCallback(async (
    request: Omit<ExportRequest, 'workspaceId'>
  ): Promise<ExportJob | null> => {
    setCreating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          workspaceId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create export: ${response.statusText}`);
      }
      
      const job: ExportJob = await response.json();
      setJobs(prev => [job, ...prev]);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create export');
      return null;
    } finally {
      setCreating(false);
    }
  }, [workspaceId]);

  /**
   * Cancel an export job
   */
  const cancelExport = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/exports/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel export: ${response.statusText}`);
      }
      
      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed' as ExportStatus, errorMessage: 'Cancelled by user' }
          : job
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel export');
      return false;
    }
  }, []);

  /**
   * Download an export file
   */
  const downloadExport = useCallback((job: ExportJob) => {
    if (!job.downloadUrl || job.status !== 'completed') {
      setError('Export is not ready for download');
      return;
    }
    
    // Open download in new tab/window
    window.open(job.downloadUrl, '_blank');
  }, []);

  /**
   * Refresh jobs list
   */
  const refreshJobs = useCallback(async () => {
    await fetchJobs();
  }, [fetchJobs]);

  /**
   * Get available formats
   */
  const getAvailableFormats = useCallback(() => {
    return EXPORT_FORMATS;
  }, []);

  /**
   * Get available fields
   */
  const getAvailableFields = useCallback(() => {
    return EXPORT_FIELDS;
  }, []);

  /**
   * Check if format supports geometry
   */
  const supportsGeometry = useCallback((format: ExportFormat): boolean => {
    return getExportFormatConfig(format).supportsGeometry;
  }, []);

  // Poll for job status updates
  useEffect(() => {
    const hasPendingJobs = jobs.some(job => 
      job.status === 'pending' || job.status === 'processing'
    );
    
    if (!hasPendingJobs) return;
    
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    creating,
    createExport,
    refreshJobs,
    cancelExport,
    downloadExport,
    getAvailableFormats,
    getAvailableFields,
    supportsGeometry,
  };
}
