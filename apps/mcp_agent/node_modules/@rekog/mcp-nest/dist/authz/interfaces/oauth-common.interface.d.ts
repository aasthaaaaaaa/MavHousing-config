export interface OAuthUserProfile {
    id: string;
    username: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    raw?: any;
}
export interface OAuthSession {
    sessionId: string;
    state: string;
    clientId?: string;
    redirectUri?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    oauthState?: string;
    scope?: string;
    resource?: string;
    expiresAt: number;
}
//# sourceMappingURL=oauth-common.interface.d.ts.map