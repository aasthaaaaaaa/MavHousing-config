import type { ClientRegistrationDto, IOAuthStore, OAuthClient } from '../stores/oauth-store.interface';
import type { OAuthModuleOptions } from '../providers/oauth-provider.interface';
export declare class ClientService {
    private readonly store;
    private readonly options;
    constructor(store: IOAuthStore, options: OAuthModuleOptions);
    registerClient(registrationDto: ClientRegistrationDto): Promise<OAuthClient>;
    protected preRegistrationChecks(_dto: ClientRegistrationDto): Promise<void>;
    getClient(clientId: string): Promise<OAuthClient | null>;
    validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean>;
}
//# sourceMappingURL=client.service.d.ts.map