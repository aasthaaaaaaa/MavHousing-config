import { CanActivate, Logger, Type } from '@nestjs/common';
import type { McpOptions } from '../interfaces';
import { McpStreamableHttpService } from '../services/mcp-streamable-http.service';
export declare function createStreamableHttpController(endpoint: string, apiPrefix: string, guards?: Type<CanActivate>[], decorators?: ClassDecorator[], options?: McpOptions): {
    new (mcpOptions: McpOptions, mcpStreamableHttpService: McpStreamableHttpService): {
        readonly logger: Logger;
        readonly mcpOptions: McpOptions;
        readonly mcpStreamableHttpService: McpStreamableHttpService;
        handlePostRequest(req: any, res: any, body: unknown): Promise<void>;
        handleGetRequest(req: any, res: any): Promise<void>;
        handleDeleteRequest(req: any, res: any): Promise<void>;
    };
};
//# sourceMappingURL=streamable-http.controller.factory.d.ts.map