"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const jwt = __importStar(require("jsonwebtoken"));
let JwtTokenService = class JwtTokenService {
    constructor(options) {
        const jwtSecret = options.jwtSecret;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET must be set in environment variables.');
        }
        this.jwtSecret = jwtSecret;
        this.issuer =
            options.jwtIssuer || options.serverUrl || 'https://localhost:3000';
        this.accessTokenExpiresIn = options.jwtAccessTokenExpiresIn;
        this.refreshTokenExpiresIn = options.jwtRefreshTokenExpiresIn;
        this.enableRefreshTokens = options.enableRefreshTokens;
    }
    generateTokenPair(userId, clientId, scope = '', resource, extras) {
        if (!resource) {
            throw new Error('Resource is required for token generation');
        }
        const jti = (0, crypto_1.randomBytes)(16).toString('hex');
        const accessTokenPayload = {
            sub: userId,
            azp: clientId,
            iss: this.issuer,
            aud: resource,
            resource: resource,
            type: 'access',
        };
        if (extras?.user_profile_id) {
            accessTokenPayload.user_profile_id = extras.user_profile_id;
        }
        if (extras?.user_data) {
            accessTokenPayload.user_data = extras.user_data;
        }
        accessTokenPayload.scope = scope || '';
        const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, {
            algorithm: 'HS256',
            expiresIn: this.accessTokenExpiresIn,
        });
        let refreshToken = undefined;
        if (this.enableRefreshTokens) {
            const refreshTokenPayload = {
                sub: userId,
                client_id: clientId,
                scope,
                resource,
                type: 'refresh',
                jti: `refresh_${jti}`,
                iss: this.issuer,
                aud: resource,
            };
            if (extras?.user_profile_id) {
                refreshTokenPayload.user_profile_id = extras.user_profile_id;
            }
            refreshToken = jwt.sign(refreshTokenPayload, this.jwtSecret, {
                algorithm: 'HS256',
                expiresIn: this.refreshTokenExpiresIn,
            });
        }
        return {
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: this.parseDurationToSeconds(this.accessTokenExpiresIn),
            ...(refreshToken ? { refresh_token: refreshToken } : {}),
        };
    }
    validateToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                algorithms: ['HS256'],
            });
        }
        catch {
            return null;
        }
    }
    refreshAccessToken(refreshToken) {
        if (!this.enableRefreshTokens) {
            return null;
        }
        const payload = this.validateToken(refreshToken);
        if (!payload || payload.type !== 'refresh') {
            return null;
        }
        return this.generateTokenPair(payload.sub, payload.client_id, payload.scope, payload.resource, {
            user_profile_id: payload.user_profile_id,
            user_data: payload.user_data,
        });
    }
    generateUserToken(userId, userData) {
        const jti = (0, crypto_1.randomBytes)(16).toString('hex');
        const serverUrl = process.env.SERVER_URL || 'https://localhost:3000';
        const payload = {
            sub: userId,
            type: 'user',
            user_data: userData,
            jti: `user_${jti}`,
            iss: serverUrl,
            aud: 'mcp-client',
        };
        return jwt.sign(payload, this.jwtSecret, {
            algorithm: 'HS256',
            expiresIn: '24h',
        });
    }
    parseDurationToSeconds(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid duration format: ${duration}`);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                throw new Error(`Unsupported duration unit: ${unit}`);
        }
    }
};
exports.JwtTokenService = JwtTokenService;
exports.JwtTokenService = JwtTokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('OAUTH_MODULE_OPTIONS')),
    __metadata("design:paramtypes", [Object])
], JwtTokenService);
//# sourceMappingURL=jwt-token.service.js.map