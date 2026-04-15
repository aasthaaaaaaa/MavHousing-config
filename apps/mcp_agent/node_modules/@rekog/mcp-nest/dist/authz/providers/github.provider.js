"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubOAuthProvider = void 0;
const normalize_endpoint_1 = require("../../mcp/utils/normalize-endpoint");
const passport_github_1 = require("passport-github");
exports.GitHubOAuthProvider = {
    name: 'github',
    strategy: passport_github_1.Strategy,
    strategyOptions: ({ serverUrl, clientId, clientSecret, callbackPath }) => ({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: (0, normalize_endpoint_1.normalizeEndpoint)(`${serverUrl}/${callbackPath}`),
    }),
    scope: ['user:email'],
    profileMapper: (profile) => ({
        id: profile.id,
        username: profile.username || profile.login,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName || profile.name,
        avatarUrl: profile.photos?.[0]?.value || profile.avatar_url,
        raw: profile,
    }),
};
//# sourceMappingURL=github.provider.js.map