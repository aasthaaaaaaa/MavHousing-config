import { CanActivate, Logger, Type } from '@nestjs/common';
import type { McpOptions } from '../interfaces';
import { McpSseService } from '../services/mcp-sse.service';
export declare function createSseController(sseEndpoint: string, messagesEndpoint: string, apiPrefix: string, guards?: Type<CanActivate>[], decorators?: ClassDecorator[], options?: McpOptions): {
    new (mcpOptions: McpOptions, mcpSseService: McpSseService): {
        readonly logger: Logger;
        readonly mcpOptions: McpOptions;
        readonly mcpSseService: McpSseService;
        onModuleInit(): void;
        sse(rawReq: any, rawRes: any): Promise<void>;
        messages(rawReq: any, rawRes: any, body: unknown): Promise<void>;
    };
};
//# sourceMappingURL=sse.controller.factory.d.ts.map