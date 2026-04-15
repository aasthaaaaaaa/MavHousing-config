"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let MemoryStore = class MemoryStore {
    constructor() {
        this.clients = new Map();
        this.authCodes = new Map();
        this.oauthSessions = new Map();
        this.userProfiles = new Map();
        this.providerUserIndex = new Map();
    }
    async storeClient(client) {
        this.clients.set(client.client_id, client);
        return client;
    }
    async getClient(client_id) {
        return this.clients.get(client_id);
    }
    async findClient(client_name) {
        for (const client of this.clients.values()) {
            if (client.client_name === client_name) {
                return client;
            }
        }
        return undefined;
    }
    async storeAuthCode(code) {
        this.authCodes.set(code.code, code);
    }
    async getAuthCode(code) {
        return this.authCodes.get(code);
    }
    async removeAuthCode(code) {
        this.authCodes.delete(code);
    }
    async storeOAuthSession(sessionId, session) {
        this.oauthSessions.set(sessionId, session);
    }
    async getOAuthSession(sessionId) {
        const session = this.oauthSessions.get(sessionId);
        if (session && session.expiresAt < Date.now()) {
            this.oauthSessions.delete(sessionId);
            return undefined;
        }
        return session;
    }
    async removeOAuthSession(sessionId) {
        this.oauthSessions.delete(sessionId);
    }
    generateClientId(client) {
        const normalizedClient = this.normalizeClientObject(client);
        const clientString = JSON.stringify(normalizedClient);
        const hash = (0, crypto_1.createHash)('sha256').update(clientString).digest('hex');
        const normalizedName = client.client_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        return `${normalizedName}_${hash.substring(0, 16)}`;
    }
    normalizeClientObject(client) {
        const normalized = {};
        const sortedKeys = Object.keys(client).sort();
        for (const key of sortedKeys) {
            const value = client[key];
            if (Array.isArray(value)) {
                normalized[key] = [...value].sort();
            }
            else {
                normalized[key] = value;
            }
        }
        return normalized;
    }
    async upsertUserProfile(profile, provider) {
        const key = `${provider}:${profile.id}`;
        let profileId = this.providerUserIndex.get(key);
        if (!profileId) {
            profileId = this.generateProfileId(provider, profile.id);
            this.providerUserIndex.set(key, profileId);
        }
        this.userProfiles.set(profileId, {
            profile_id: profileId,
            provider,
            ...profile,
        });
        return profileId;
    }
    async getUserProfileById(profileId) {
        return this.userProfiles.get(profileId);
    }
    generateProfileId(provider, providerUserId) {
        const input = `${provider}:${providerUserId}`;
        return (0, crypto_1.createHash)('sha256').update(input).digest('hex').slice(0, 24);
    }
};
exports.MemoryStore = MemoryStore;
exports.MemoryStore = MemoryStore = __decorate([
    (0, common_1.Injectable)()
], MemoryStore);
//# sourceMappingURL=memory-store.service.js.map