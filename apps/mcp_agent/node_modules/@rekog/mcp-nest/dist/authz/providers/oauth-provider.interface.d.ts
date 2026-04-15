import type { IOAuthStore } from '../stores/oauth-store.interface';
import type { OAuthSession, OAuthUserProfile } from '../interfaces/oauth-common.interface';
export type { OAuthSession, OAuthUserProfile };
type TypeOrmModuleOptions = Record<string, unknown>;
export interface OAuthProviderConfig {
    name: string;
    displayName?: string;
    strategy: any;
    strategyOptions: (options: {
        serverUrl: string;
        clientId: string;
        clientSecret: string;
        callbackPath?: string;
    }) => any;
    scope?: string[];
    profileMapper: (profile: any) => OAuthUserProfile;
}
export type StoreConfiguration = {
    type: 'typeorm';
    options: TypeOrmModuleOptions;
} | {
    type: 'custom';
    store: IOAuthStore;
} | {
    type: 'memory';
} | undefined;
export interface OAuthEndpointConfiguration {
    wellKnownAuthorizationServerMetadata?: string;
    wellKnownProtectedResourceMetadata?: string | string[];
    register?: string;
    authorize?: string;
    callback?: string;
    token?: string;
    revoke?: string;
}
export interface OAuthEndpointDisableOptions {
    wellKnownAuthorizationServerMetadata?: boolean;
    wellKnownProtectedResourceMetadata?: boolean;
}
export interface OAuthUserModuleOptions {
    provider: OAuthProviderConfig;
    clientId: string;
    clientSecret: string;
    jwtSecret: string;
    serverUrl?: string;
    resource?: string;
    jwtIssuer?: string;
    jwtAudience?: string;
    jwtAccessTokenExpiresIn?: string;
    jwtRefreshTokenExpiresIn?: string;
    enableRefreshTokens?: boolean;
    cookieSecure?: boolean;
    cookieMaxAge?: number;
    oauthSessionExpiresIn?: number;
    authCodeExpiresIn?: number;
    protectedResourceMetadata?: {
        scopesSupported?: string[];
        bearerMethodsSupported?: string[];
        mcpVersionsSupported?: string[];
    };
    authorizationServerMetadata?: {
        responseTypesSupported?: string[];
        responseModesSupported?: string[];
        grantTypesSupported?: string[];
        tokenEndpointAuthMethodsSupported?: string[];
        scopesSupported?: string[];
        codeChallengeMethodsSupported?: string[];
    };
    storeConfiguration?: StoreConfiguration;
    apiPrefix?: string;
    endpoints?: OAuthEndpointConfiguration;
    disableEndpoints?: OAuthEndpointDisableOptions;
}
export interface OAuthModuleDefaults {
    serverUrl: string;
    resource: string;
    jwtIssuer: string;
    jwtAudience: string;
    jwtAccessTokenExpiresIn: string;
    jwtRefreshTokenExpiresIn: string;
    enableRefreshTokens: boolean;
    cookieMaxAge: number;
    oauthSessionExpiresIn: number;
    authCodeExpiresIn: number;
    nodeEnv: string;
    apiPrefix: string;
    endpoints: OAuthEndpointConfiguration;
    disableEndpoints: OAuthEndpointDisableOptions;
    protectedResourceMetadata: {
        scopesSupported: string[];
        bearerMethodsSupported: string[];
        mcpVersionsSupported: string[];
    };
    authorizationServerMetadata: {
        responseTypesSupported: string[];
        responseModesSupported: string[];
        grantTypesSupported: string[];
        tokenEndpointAuthMethodsSupported: string[];
        scopesSupported: string[];
        codeChallengeMethodsSupported: string[];
    };
}
export type OAuthModuleOptions = Required<Pick<OAuthUserModuleOptions, 'provider' | 'clientId' | 'clientSecret' | 'jwtSecret'>> & Required<OAuthModuleDefaults> & {
    cookieSecure: boolean;
    storeConfiguration?: StoreConfiguration;
};
//# sourceMappingURL=oauth-provider.interface.d.ts.map