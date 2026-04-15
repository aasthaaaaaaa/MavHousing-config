"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureADOAuthProvider = void 0;
const passport_azure_ad_oauth2_1 = require("passport-azure-ad-oauth2");
const normalize_endpoint_1 = require("../../mcp/utils/normalize-endpoint");
exports.AzureADOAuthProvider = {
    name: 'azure-ad',
    displayName: 'Microsoft Azure AD',
    strategy: passport_azure_ad_oauth2_1.Strategy,
    strategyOptions: ({ serverUrl, clientId, clientSecret, callbackPath }) => ({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: (0, normalize_endpoint_1.normalizeEndpoint)(`${serverUrl}/${callbackPath}`),
        tenant: 'common',
        resource: 'https://graph.microsoft.com/',
    }),
    scope: ['openid', 'profile', 'email', 'User.Read'],
    profileMapper: (profile) => {
        const azureProfile = profile._json || profile;
        return {
            id: azureProfile.id || azureProfile.oid || profile.id,
            username: azureProfile.preferred_username ||
                azureProfile.userPrincipalName ||
                azureProfile.mail ||
                azureProfile.email ||
                profile.username,
            email: azureProfile.mail ||
                azureProfile.userPrincipalName ||
                azureProfile.email ||
                profile.emails?.[0]?.value,
            displayName: azureProfile.displayName || azureProfile.name || profile.displayName,
            avatarUrl: azureProfile.photo || profile.photos?.[0]?.value,
            raw: profile,
        };
    },
};
//# sourceMappingURL=azure-ad.provider.js.map