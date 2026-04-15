import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { HttpResponse } from '../interfaces/http-adapter.interface';
import type { McpOptions } from '../interfaces';
export declare class SsePingService implements OnModuleInit, OnModuleDestroy {
    private pingInterval;
    private readonly logger;
    private readonly activeConnections;
    private pingIntervalMs;
    constructor(options?: McpOptions);
    onModuleInit(): void;
    onModuleDestroy(): void;
    configure(options: {
        pingEnabled?: boolean;
        pingIntervalMs?: number;
    }): void;
    registerConnection(sessionId: string, transport: SSEServerTransport, res: HttpResponse): void;
    removeConnection(sessionId: string): void;
    private startPingInterval;
    private stopPingInterval;
    private sendPingToAllConnections;
}
//# sourceMappingURL=sse-ping.service.d.ts.map