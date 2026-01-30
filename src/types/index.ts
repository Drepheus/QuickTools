export type ToolStatus = 'active' | 'inactive' | 'using';

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: ToolStatus;
    usageCount: number;
}
