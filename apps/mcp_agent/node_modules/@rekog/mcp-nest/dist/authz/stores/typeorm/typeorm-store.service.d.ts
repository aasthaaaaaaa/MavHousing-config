import { Repository } from 'typeorm';
import { OAuthClientEntity, AuthorizationCodeEntity, OAuthSessionEntity, OAuthUserProfileEntity } from './entities';
import type { OAuthSession, OAuthUserProfile } from '../../interfaces/oauth-common.interface';
import type { AuthorizationCode, IOAuthStore, OAuthClient } from '../oauth-store.interface';
export declare class TypeOrmStore implements IOAuthStore {
    private readonly clientRepository;
    private readonly authCodeRepository;
    private readonly sessionRepository;
    private readonly userProfileRepository;
    constructor(clientRepository: Repository<OAuthClientEntity>, authCodeRepository: Repository<AuthorizationCodeEntity>, sessionRepository: Repository<OAuthSessionEntity>, userProfileRepository: Repository<OAuthUserProfileEntity>);
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
    upsertUserProfile(profile: OAuthUserProfile, provider: string): Promise<string>;
    getUserProfileById(profileId: string): Promise<(OAuthUserProfile & {
        profile_id: string;
        provider: string;
    }) | undefined>;
    private generateProfileId;
}
//# sourceMappingURL=typeorm-store.service.d.ts.map