"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleOAuthProvider = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const normalize_endpoint_1 = require("../../mcp/utils/normalize-endpoint");
exports.GoogleOAuthProvider = {
    name: 'google',
    strategy: passport_google_oauth20_1.Strategy,
    strategyOptions: ({ serverUrl, clientId, clientSecret, callbackPath }) => ({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: (0, normalize_endpoint_1.normalizeEndpoint)(`${serverUrl}/${callbackPath}`),
        scope: ['profile', 'email'],
    }),
    scope: ['profile', 'email'],
    profileMapper: (profile) => ({
        id: profile.id,
        username: profile.emails?.[0]?.value?.split('@')[0] || profile.id,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
        raw: profile,
    }),
};
//# sourceMappingURL=google.provider.js.map