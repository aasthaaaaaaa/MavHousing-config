import { OnModuleInit } from '@nestjs/common';
import type { OAuthModuleOptions } from '../providers/oauth-provider.interface';
export declare const STRATEGY_NAME = "oauth-provider";
export declare class OAuthStrategyService implements OnModuleInit {
    private options;
    private authModuleId?;
    private strategyName;
    constructor(options: OAuthModuleOptions, authModuleId?: string | undefined);
    onModuleInit(): void;
    private registerStrategy;
    getStrategyName(): string;
}
//# sourceMappingURL=oauth-strategy.service.d.ts.map