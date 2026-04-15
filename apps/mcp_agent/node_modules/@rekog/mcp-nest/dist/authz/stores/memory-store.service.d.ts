import { OAuthSession, OAuthUserProfile } from '../providers/oauth-provider.interface';
import type { AuthorizationCode, IOAuthStore, OAuthClient } from './oauth-store.interface';
export declare class MemoryStore implements IOAuthStore {
    private clients;
    private authCodes;
    private oauthSessions;
    private userProfiles;
    private providerUserIndex;
    storeClient(client: OAuthClient): Promise<OAuthClient>;
    getClient(client_id: string): Promise<OAuthClient | undefined>;
    findClient(client_name: string): Promise<OAuthClient | undefined>;
    storeAuthCode(code: AuthorizationCode): Promise<void>;
    getAuthCode(code: string): Promise<AuthorizationCode | undefined>;
    removeAuthCode(code: string): Promise<void>;
    storeOAuthSession(sessionId: string, session: OAuthSession): Promise<void>;
    getOAuthSession(sessionId: string): Promise<OAuthSession | undefined>;
    removeOAuthSession(sessionId: string): Promise<void>;
    generateClientId(client: OAuthClient): string;
    private normalizeClientObject;
    upsertUserProfile(profile: OAuthUserProfile, provider: string): Promise<string>;
    getUserProfileById(profileId: string): Promise<(OAuthUserProfile & {
        profile_id: string;
        provider: string;
    }) | undefined>;
    private generateProfileId;
}
//# sourceMappingURL=memory-store.service.d.ts.map