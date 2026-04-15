import type { OAuthSession, OAuthUserProfile } from '../interfaces/oauth-common.interface';
export declare const MCP_OAUTH_TOKEN = "MCP_OAUTH_TOKEN";
export interface OAuthClient {
    client_id: string;
    client_secret?: string;
    client_name: string;
    client_description?: string;
    logo_uri?: string;
    client_uri?: string;
    developer_name?: string;
    developer_email?: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    token_endpoint_auth_method: string;
    created_at: Date;
    updated_at: Date;
}
export interface AuthorizationCode {
    code: string;
    user_id: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    resource?: string;
    scope?: string;
    expires_at: number;
    used_at?: Date;
    user_profile_id?: string;
}
export interface ClientRegistrationDto {
    client_name: string;
    client_description?: string;
    logo_uri?: string;
    client_uri?: string;
    developer_name?: string;
    developer_email?: string;
    redirect_uris: string[];
    grant_types?: string[];
    response_types?: string[];
    token_endpoint_auth_method?: string;
}
export interface IOAuthStore {
    storeClient(client: OAuthClient): Promise<OAuthClient>;
    getClient(client_id: string): Promise<OAuthClient | undefined>;
    findClient(client_name: string): Promise<OAuthClient | undefined>;
    generateClientId(client: OAuthClient): string;
    storeAuthCode(code: AuthorizationCode): Promise<void>;
    getAuthCode(code: string): Promise<AuthorizationCode | undefined>;
    removeAuthCode(code: string): Promise<void>;
    storeOAuthSession(sessionId: string, session: OAuthSession): Promise<void>;
    getOAuthSession(sessionId: string): Promise<OAuthSession | undefined>;
    removeOAuthSession(sessionId: string): Promise<void>;
    upsertUserProfile(profile: OAuthUserProfile, provider: string): Promise<string>;
    getUserProfileById(profileId: string): Promise<(OAuthUserProfile & {
        profile_id: string;
        provider: string;
    }) | undefined>;
}
//# sourceMappingURL=oauth-store.interface.d.ts.map