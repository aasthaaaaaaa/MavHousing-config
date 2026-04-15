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
exports.ClientService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let ClientService = class ClientService {
    constructor(store, options) {
        this.store = store;
        this.options = options;
    }
    async registerClient(registrationDto) {
        if (!registrationDto.redirect_uris ||
            !Array.isArray(registrationDto.redirect_uris)) {
            throw new common_1.BadRequestException('redirect_uris is required and must be an array');
        }
        const supportedAuthMethods = [
            'client_secret_basic',
            'client_secret_post',
            'none',
        ];
        if (registrationDto.token_endpoint_auth_method &&
            !supportedAuthMethods.includes(registrationDto.token_endpoint_auth_method)) {
            throw new common_1.BadRequestException(`Unsupported token_endpoint_auth_method. Supported methods: ${supportedAuthMethods.join(', ')}`);
        }
        const defaultClientValues = {
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
            token_endpoint_auth_method: registrationDto.token_endpoint_auth_method || 'none',
        };
        await this.preRegistrationChecks(registrationDto);
        const now = new Date();
        const client_id = this.store.generateClientId(registrationDto);
        const authMethod = registrationDto.token_endpoint_auth_method || 'none';
        const client_secret = authMethod !== 'none' ? (0, crypto_1.randomBytes)(32).toString('hex') : undefined;
        const newClient = {
            ...defaultClientValues,
            ...registrationDto,
            client_id,
            client_secret,
            created_at: now,
            updated_at: now,
        };
        const client = await this.store.storeClient(newClient);
        const filteredClient = Object.fromEntries(Object.entries(client).filter(([, value]) => value !== null));
        return filteredClient;
    }
    async preRegistrationChecks(_dto) {
    }
    async getClient(clientId) {
        const client = await this.store.getClient(clientId);
        if (!client) {
            return null;
        }
        const filteredClient = Object.fromEntries(Object.entries(client).filter(([, value]) => value !== null));
        return filteredClient;
    }
    async validateRedirectUri(clientId, redirectUri) {
        const client = await this.getClient(clientId);
        return client ? client.redirect_uris.includes(redirectUri) : false;
    }
};
exports.ClientService = ClientService;
exports.ClientService = ClientService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IOAuthStore')),
    __param(1, (0, common_1.Inject)('OAUTH_MODULE_OPTIONS')),
    __metadata("design:paramtypes", [Object, Object])
], ClientService);
//# sourceMappingURL=client.service.js.map