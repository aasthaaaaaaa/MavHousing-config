import { DynamicModule } from '@nestjs/common';
import type { OAuthUserModuleOptions as AuthUserModuleOptions, OAuthModuleDefaults } from './providers/oauth-provider.interface';
export declare const DEFAULT_OPTIONS: OAuthModuleDefaults;
export declare class McpAuthModule {
    readonly __isMcpAuthModule = true;
    static forRoot(options: AuthUserModuleOptions): DynamicModule;
    private static mergeAndValidateOptions;
    private static validateRequiredOptions;
    private static validateResolvedOptions;
    private static createStoreProvider;
}
//# sourceMappingURL=mcp-oauth.module.d.ts.map