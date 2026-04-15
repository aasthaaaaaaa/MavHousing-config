export declare class AuthorizationCodeEntity {
    code: string;
    user_id: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    expires_at: number;
    resource: string;
    scope?: string;
    used_at?: Date;
    user_profile_id?: string;
    created_at: Date;
}
//# sourceMappingURL=authorization-code.entity.d.ts.map