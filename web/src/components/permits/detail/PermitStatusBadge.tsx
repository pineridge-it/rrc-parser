'use client';

interface PermitStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

export function PermitStatusBadge({ status, size = 'medium' }: PermitStatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          backgroundColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
        };
      case 'pending':
        return {
          backgroundColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
        };
      case 'denied':
        return {
          backgroundColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
        };
      case 'amendment':
        return {
          backgroundColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
        };
      case 'expired':
        return {
          backgroundColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        };
      case 'cancelled':
        return {
          backgroundColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        };
      default:
        return {
          backgroundColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        };
    }
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-0.5 text-sm',
    large: 'px-3 py-1 text-sm',
  };

  const style = getStatusStyle(status);

  return (
    <span
      className={`${style.backgroundColor} ${style.textColor} ${style.borderColor} ${sizeClasses[size]} font-medium rounded-full border`}
    >
      {status}
    </span>
  );
}