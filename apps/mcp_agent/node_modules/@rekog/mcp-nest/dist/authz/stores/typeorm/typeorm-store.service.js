"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmStore = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const entities_1 = require("./entities");
const constants_1 = require("./constants");
let TypeOrmStore = class TypeOrmStore {
    constructor(clientRepository, authCodeRepository, sessionRepository, userProfileRepository) {
        this.clientRepository = clientRepository;
        this.authCodeRepository = authCodeRepository;
        this.sessionRepository = sessionRepository;
        this.userProfileRepository = userProfileRepository;
    }
    async storeClient(client) {
        const savedClient = await this.clientRepository.save(client);
        return savedClient;
    }
    async getClient(client_id) {
        return ((await this.clientRepository.findOne({ where: { client_id } })) ??
            undefined);
    }
    async findClient(client_name) {
        return ((await this.clientRepository.findOne({ where: { client_name } })) ??
            undefined);
    }
    async storeAuthCode(code) {
        await this.authCodeRepository.save(code);
    }
    async getAuthCode(code) {
        const authCode = await this.authCodeRepository.findOne({ where: { code } });
        if (authCode && authCode.expires_at < Date.now()) {
            await this.authCodeRepository.delete({ code });
            return undefined;
        }
        return authCode ?? undefined;
    }
    async removeAuthCode(code) {
        await this.authCodeRepository.delete({ code });
    }
    async storeOAuthSession(sessionId, session) {
        await this.sessionRepository.save({ ...session, sessionId });
    }
    async getOAuthSession(sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { sessionId },
        });
        if (session && session.expiresAt < Date.now()) {
            await this.sessionRepository.delete({ sessionId });
            return undefined;
        }
        return session ?? undefined;
    }
    async removeOAuthSession(sessionId) {
        await this.sessionRepository.delete({ sessionId });
    }
    generateClientId(client) {
        const normalizedName = client.client_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        const salt = (0, crypto_1.randomBytes)(4).toString('hex');
        return `${normalizedName}_${salt}`;
    }
    async upsertUserProfile(profile, provider) {
        const existing = await this.userProfileRepository.findOne({
            where: { provider, provider_user_id: profile.id },
        });
        if (existing) {
            existing.username = profile.username;
            existing.email = profile.email;
            existing.displayName = profile.displayName;
            existing.avatarUrl = profile.avatarUrl;
            existing.raw = profile.raw ? JSON.stringify(profile.raw) : existing.raw;
            await this.userProfileRepository.save(existing);
            return existing.profile_id;
        }
        const entity = this.userProfileRepository.create({
            profile_id: this.generateProfileId(provider, profile.id),
            provider_user_id: profile.id,
            provider,
            username: profile.username,
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            raw: profile.raw ? JSON.stringify(profile.raw) : undefined,
        });
        const saved = await this.userProfileRepository.save(entity);
        return saved.profile_id;
    }
    async getUserProfileById(profileId) {
        const entity = await this.userProfileRepository.findOne({
            where: { profile_id: profileId },
        });
        if (!entity)
            return undefined;
        return {
            profile_id: entity.profile_id,
            provider: entity.provider,
            id: entity.provider_user_id,
            username: entity.username,
            email: entity.email,
            displayName: entity.displayName,
            avatarUrl: entity.avatarUrl,
            raw: entity.raw ? JSON.parse(entity.raw) : undefined,
        };
    }
    generateProfileId(provider, providerUserId) {
        const input = `${provider}:${providerUserId}`;
        return (0, crypto_1.createHash)('sha256').update(input).digest('hex').slice(0, 24);
    }
};
exports.TypeOrmStore = TypeOrmStore;
exports.TypeOrmStore = TypeOrmStore = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.OAuthClientEntity, constants_1.OAUTH_TYPEORM_CONNECTION_NAME)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.AuthorizationCodeEntity, constants_1.OAUTH_TYPEORM_CONNECTION_NAME)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.OAuthSessionEntity, constants_1.OAUTH_TYPEORM_CONNECTION_NAME)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.OAuthUserProfileEntity, constants_1.OAUTH_TYPEORM_CONNECTION_NAME)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TypeOrmStore);
//# sourceMappingURL=typeorm-store.service.js.map