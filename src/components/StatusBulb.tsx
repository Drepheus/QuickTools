import type { ToolStatus } from '../types';

interface StatusBulbProps {
    status: ToolStatus;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
};

export function StatusBulb({ status, size = 'md' }: StatusBulbProps) {
    return (
        <div
            className={`status-bulb ${status} ${sizeClasses[size]} rounded-full`}
            title={status.charAt(0).toUpperCase() + status.slice(1)}
        />
    );
}
