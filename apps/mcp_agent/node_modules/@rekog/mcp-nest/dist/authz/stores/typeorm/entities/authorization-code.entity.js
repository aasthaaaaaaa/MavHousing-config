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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationCodeEntity = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../constants");
let AuthorizationCodeEntity = class AuthorizationCodeEntity {
};
exports.AuthorizationCodeEntity = AuthorizationCodeEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "client_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "redirect_uri", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "code_challenge", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "code_challenge_method", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], AuthorizationCodeEntity.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], AuthorizationCodeEntity.prototype, "used_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuthorizationCodeEntity.prototype, "user_profile_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AuthorizationCodeEntity.prototype, "created_at", void 0);
exports.AuthorizationCodeEntity = AuthorizationCodeEntity = __decorate([
    (0, typeorm_1.Entity)(`${constants_1.OAUTH_TABLE_PREFIX}authorization_codes`)
], AuthorizationCodeEntity);
//# sourceMappingURL=authorization-code.entity.js.map