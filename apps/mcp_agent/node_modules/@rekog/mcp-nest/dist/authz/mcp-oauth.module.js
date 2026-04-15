"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var McpAuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpAuthModule = exports.DEFAULT_OPTIONS = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const mcp_oauth_controller_1 = require("./mcp-oauth.controller");
const client_service_1 = require("./services/client.service");
const jwt_token_service_1 = require("./services/jwt-token.service");
const oauth_strategy_service_1 = require("./services/oauth-strategy.service");
const memory_store_service_1 = require("./stores/memory-store.service");
const normalize_endpoint_1 = require("../mcp/utils/normalize-endpoint");
const constants_1 = require("./stores/typeorm/constants");
let authInstanceIdCounter = 0;
exports.DEFAULT_OPTIONS = {
    serverUrl: 'http://localhost:3000',
    resource: 'http://localhost:3000/mcp',
    jwtIssuer: 'http://localhost:3000',
    jwtAudience: 'mcp-client',
    jwtAccessTokenExpiresIn: '1d',
    jwtRefreshTokenExpiresIn: '30d',
    enableRefreshTokens: true,
    cookieMaxAge: 24 * 60 * 60 * 1000,
    oauthSessionExpiresIn: 10 * 60 * 1000,
    authCodeExpiresIn: 10 * 60 * 1000,
    nodeEnv: 'development',
    apiPrefix: '',
    endpoints: {
        wellKnownAuthorizationServerMetadata: '/.well-known/oauth-authorization-server',
        wellKnownProtectedResourceMetadata: '/.well-known/oauth-protected-resource',
        register: '/register',
        authorize: '/authorize',
        callback: '/callback',
        token: '/token',
        revoke: '/revoke',
    },
    disableEndpoints: {
        wellKnownAuthorizationServerMetadata: false,
        wellKnownProtectedResourceMetadata: false,
    },
    protectedResourceMetadata: {
        scopesSupported: ['offline_access'],
        bearerMethodsSupported: ['header'],
        mcpVersionsSupported: ['2025-06-18'],
    },
    authorizationServerMetadata: {
        responseTypesSupported: ['code'],
        responseModesSupported: ['query'],
        grantTypesSupported: ['authorization_code', 'refresh_token'],
        tokenEndpointAuthMethodsSupported: [
            'client_secret_basic',
            'client_secret_post',
            'none',
        ],
        scopesSupported: ['offline_access'],
        codeChallengeMethodsSupported: ['plain', 'S256'],
    },
};
let McpAuthModule = McpAuthModule_1 = class McpAuthModule {
    constructor() {
        this.__isMcpAuthModule = true;
    }
    static forRoot(options) {
        const authModuleId = `mcp-auth-module-${authInstanceIdCounter++}`;
        const resolvedOptions = this.mergeAndValidateOptions(exports.DEFAULT_OPTIONS, options);
        resolvedOptions.endpoints = prepareEndpoints(resolvedOptions.apiPrefix, exports.DEFAULT_OPTIONS.endpoints, options.endpoints || {});
        const oauthModuleOptionsToken = `OAUTH_MODULE_OPTIONS_${authModuleId}`;
        const oauthModuleOptions = {
            provide: oauthModuleOptionsToken,
            useValue: resolvedOptions,
        };
        const imports = [
            config_1.ConfigModule,
            passport_1.PassportModule.register({
                defaultStrategy: 'jwt',
                session: false,
            }),
            jwt_1.JwtModule.register({
                secret: resolvedOptions.jwtSecret,
                signOptions: {
                    issuer: resolvedOptions.jwtIssuer,
                    audience: resolvedOptions.jwtAudience,
                },
            }),
        ];
        const storeConfig = resolvedOptions.storeConfiguration;
        const isTypeOrmStore = storeConfig?.type === 'typeorm';
        if (isTypeOrmStore) {
            const typeormOptions = storeConfig.options;
            try {
                const { TypeOrmModule } = require('@nestjs/typeorm');
                const { OAuthClientEntity, AuthorizationCodeEntity, OAuthSessionEntity, OAuthUserProfileEntity, } = require('./stores/typeorm/entities');
                imports.push(TypeOrmModule.forRoot({
                    ...typeormOptions,
                    name: constants_1.OAUTH_TYPEORM_CONNECTION_NAME,
                    entities: [
                        OAuthClientEntity,
                        AuthorizationCodeEntity,
                        OAuthSessionEntity,
                        OAuthUserProfileEntity,
                    ],
                }), TypeOrmModule.forFeature([
                    OAuthClientEntity,
                    AuthorizationCodeEntity,
                    OAuthSessionEntity,
                    OAuthUserProfileEntity,
                ], constants_1.OAUTH_TYPEORM_CONNECTION_NAME));
            }
            catch (err) {
                throw new Error("To use the TypeORM store, please install '@nestjs/typeorm' and 'typeorm'.");
            }
        }
        const oauthStoreToken = `IOAuthStore_${authModuleId}`;
        const oauthStoreProvider = this.createStoreProvider(resolvedOptions.storeConfiguration, oauthStoreToken);
        const oauthStoreAliasProvider = {
            provide: memory_store_service_1.MemoryStore,
            useExisting: oauthStoreToken,
        };
        const providers = [
            {
                provide: 'OAUTH_MODULE_ID',
                useValue: authModuleId,
            },
            oauthModuleOptions,
            oauthStoreProvider,
            oauthStoreAliasProvider,
            {
                provide: 'OAUTH_MODULE_OPTIONS',
                useExisting: oauthModuleOptionsToken,
            },
            {
                provide: 'IOAuthStore',
                useExisting: oauthStoreToken,
            },
            oauth_strategy_service_1.OAuthStrategyService,
            client_service_1.ClientService,
            jwt_token_service_1.JwtTokenService,
            jwt_auth_guard_1.McpAuthJwtGuard,
        ];
        const OAuthControllerClass = (0, mcp_oauth_controller_1.createMcpOAuthController)(resolvedOptions.endpoints, {
            disableWellKnownAuthorizationServerMetadata: resolvedOptions.disableEndpoints
                .wellKnownAuthorizationServerMetadata ?? false,
            disableWellKnownProtectedResourceMetadata: resolvedOptions.disableEndpoints.wellKnownProtectedResourceMetadata ??
                false,
        }, authModuleId);
        return {
            module: McpAuthModule_1,
            imports,
            controllers: [OAuthControllerClass],
            providers,
            exports: [
                'OAUTH_MODULE_ID',
                'OAUTH_MODULE_OPTIONS',
                'IOAuthStore',
                jwt_token_service_1.JwtTokenService,
                client_service_1.ClientService,
                oauth_strategy_service_1.OAuthStrategyService,
                jwt_auth_guard_1.McpAuthJwtGuard,
                memory_store_service_1.MemoryStore,
            ],
        };
    }
    static mergeAndValidateOptions(defaults, options) {
        this.validateRequiredOptions(options);
        const resolvedOptions = {
            ...defaults,
            ...options,
            jwtIssuer: options.jwtIssuer || options.serverUrl || exports.DEFAULT_OPTIONS.jwtIssuer,
            cookieSecure: options.cookieSecure || process.env.NODE_ENV === 'production',
            protectedResourceMetadata: {
                ...defaults.protectedResourceMetadata,
                ...options.protectedResourceMetadata,
            },
            authorizationServerMetadata: {
                ...defaults.authorizationServerMetadata,
                ...options.authorizationServerMetadata,
            },
            disableEndpoints: {
                ...defaults.disableEndpoints,
                ...(options.disableEndpoints || {}),
            },
        };
        if (!resolvedOptions.enableRefreshTokens) {
            resolvedOptions.authorizationServerMetadata.grantTypesSupported =
                resolvedOptions.authorizationServerMetadata.grantTypesSupported.filter((g) => g !== 'refresh_token');
            resolvedOptions.protectedResourceMetadata.scopesSupported =
                resolvedOptions.protectedResourceMetadata.scopesSupported.filter((s) => s !== 'offline_access');
        }
        this.validateResolvedOptions(resolvedOptions);
        return resolvedOptions;
    }
    static validateRequiredOptions(options) {
        const requiredFields = [
            'provider',
            'clientId',
            'clientSecret',
            'jwtSecret',
        ];
        for (const field of requiredFields) {
            if (!options[field]) {
                throw new Error(`OAuthModuleOptions: ${String(field)} is required and must be provided by the user`);
            }
        }
    }
    static validateResolvedOptions(options) {
        if (options.jwtSecret.length < 32) {
            throw new Error('OAuthModuleOptions: jwtSecret must be at least 32 characters long');
        }
        try {
            new URL(options.serverUrl);
            new URL(options.jwtIssuer);
        }
        catch {
            throw new Error('OAuthModuleOptions: serverUrl and jwtIssuer must be valid URLs');
        }
        if (!options.provider.name || !options.provider.strategy) {
            throw new Error('OAuthModuleOptions: provider must have name and strategy');
        }
    }
    static createStoreProvider(storeConfiguration, provideToken) {
        if (!storeConfiguration || storeConfiguration.type === 'memory') {
            return {
                provide: provideToken,
                useValue: new memory_store_service_1.MemoryStore(),
            };
        }
        if (storeConfiguration.type === 'typeorm') {
            const { TypeOrmStore, } = require('./stores/typeorm/typeorm-store.service');
            return {
                provide: provideToken,
                useClass: TypeOrmStore,
            };
        }
        if (storeConfiguration.type === 'custom') {
            return {
                provide: provideToken,
                useValue: storeConfiguration.store,
            };
        }
        throw new Error(`Unknown store configuration type: ${storeConfiguration.type}`);
    }
};
exports.McpAuthModule = McpAuthModule;
exports.McpAuthModule = McpAuthModule = McpAuthModule_1 = __decorate([
    (0, common_1.Module)({})
], McpAuthModule);
function prepareEndpoints(apiPrefix, defaultEndpoints, configuredEndpoints) {
    const updatedDefaultEndpoints = {
        wellKnownAuthorizationServerMetadata: defaultEndpoints.wellKnownAuthorizationServerMetadata,
        wellKnownProtectedResourceMetadata: defaultEndpoints.wellKnownProtectedResourceMetadata,
        callback: (0, normalize_endpoint_1.normalizeEndpoint)(`/${apiPrefix}/${defaultEndpoints.callback}`),
        token: (0, normalize_endpoint_1.normalizeEndpoint)(`/${apiPrefix}/${defaultEndpoints.token}`),
        revoke: (0, normalize_endpoint_1.normalizeEndpoint)(`/${apiPrefix}/${defaultEndpoints.revoke}`),
        authorize: (0, normalize_endpoint_1.normalizeEndpoint)(`/${apiPrefix}/${defaultEndpoints.authorize}`),
        register: (0, normalize_endpoint_1.normalizeEndpoint)(`/${apiPrefix}/${defaultEndpoints.register}`),
    };
    return {
        ...updatedDefaultEndpoints,
        ...configuredEndpoints,
    };
}
//# sourceMappingURL=mcp-oauth.module.js.map