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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthStrategyService = exports.STRATEGY_NAME = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = __importDefault(require("passport"));
exports.STRATEGY_NAME = 'oauth-provider';
let OAuthStrategyService = class OAuthStrategyService {
    constructor(options, authModuleId) {
        this.options = options;
        this.authModuleId = authModuleId;
        this.strategyName = authModuleId
            ? `${exports.STRATEGY_NAME}-${authModuleId}`
            : exports.STRATEGY_NAME;
    }
    onModuleInit() {
        this.registerStrategy();
    }
    registerStrategy() {
        const provider = this.options.provider;
        const clientId = this.options.clientId;
        const clientSecret = this.options.clientSecret;
        const serverUrl = this.options.serverUrl;
        const strategyOptions = provider.strategyOptions({
            serverUrl,
            clientId,
            clientSecret,
            callbackPath: this.options.endpoints.callback,
        });
        const strategy = new provider.strategy(strategyOptions, (accessToken, refreshToken, profile, done) => {
            try {
                const mappedProfile = provider.profileMapper(profile);
                return done(null, {
                    profile: mappedProfile,
                    accessToken,
                    provider: provider.name,
                });
            }
            catch (error) {
                return done(error, null);
            }
        });
        passport_1.default.use(this.strategyName, strategy);
    }
    getStrategyName() {
        return this.strategyName;
    }
};
exports.OAuthStrategyService = OAuthStrategyService;
exports.OAuthStrategyService = OAuthStrategyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('OAUTH_MODULE_OPTIONS')),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)('OAUTH_MODULE_ID')),
    __metadata("design:paramtypes", [Object, String])
], OAuthStrategyService);
//# sourceMappingURL=oauth-strategy.service.js.map