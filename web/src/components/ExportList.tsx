/**
 * Export List Component
 * Displays export jobs with status and download options
 */

'use client';

import { ExportJob, ExportStatus, EXPORT_FORMATS } from '@/types/export';

interface ExportListProps {
  jobs: ExportJob[];
  loading: boolean;
  onDownload: (job: ExportJob) => void;
  onCancel: (jobId: string) => void;
}

export function ExportList({ jobs, loading, onDownload, onCancel }: ExportListProps) {
  const getStatusIcon = (status: ExportStatus) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusClass = (status: ExportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  const getFormatLabel = (format: string) => {
    return format.toUpperCase();
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No exports yet.</p>
        <p className="text-sm mt-1">Create your first export from the search results.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Format
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Records
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expires
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(job.status)}`}>
                  <span className="mr-1">{getStatusIcon(job.status)}</span>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {getFormatLabel(job.format)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {job.recordCount?.toLocaleString() || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(job.fileSize)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(job.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {job.expiresAt ? (
                  new Date(job.expiresAt) < new Date() ? (
                    <span className="text-red-600">Expired</span>
                  ) : (
                    formatDate(job.expiresAt)
                  )
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                {job.status === 'completed' && job.downloadUrl && (
                  <button
                    onClick={() => onDownload(job)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Download
                  </button>
                )}
                {(job.status === 'pending' || job.status === 'processing') && (
                  <button
                    onClick={() => onCancel(job.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Cancel
                  </button>
                )}
                {job.status === 'failed' && job.errorMessage && (
                  <span className="text-red-600 text-xs" title={job.errorMessage}>
                    Error
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
