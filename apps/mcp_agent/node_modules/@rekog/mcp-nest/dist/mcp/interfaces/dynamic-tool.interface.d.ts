import { z } from 'zod';
import { Context } from './mcp-tool.interface';
import { ToolAnnotations } from '../decorators/tool.decorator';
export type DynamicToolHandler = (args: Record<string, unknown>, context: Context, request: any) => Promise<any> | any;
export interface DynamicToolDefinition {
    name: string;
    description: string;
    parameters?: z.ZodType;
    outputSchema?: z.ZodType;
    annotations?: ToolAnnotations;
    _meta?: Record<string, any>;
    handler: DynamicToolHandler;
    isPublic?: boolean;
    requiredScopes?: string[];
    requiredRoles?: string[];
}
//# sourceMappingURL=dynamic-tool.interface.d.ts.map