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
exports.OAuthClientEntity = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../constants");
let OAuthClientEntity = class OAuthClientEntity {
};
exports.OAuthClientEntity = OAuthClientEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "client_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "client_secret", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "client_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "client_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "logo_uri", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "client_uri", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "developer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "developer_email", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], OAuthClientEntity.prototype, "redirect_uris", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], OAuthClientEntity.prototype, "grant_types", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], OAuthClientEntity.prototype, "response_types", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OAuthClientEntity.prototype, "token_endpoint_auth_method", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], OAuthClientEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], OAuthClientEntity.prototype, "updated_at", void 0);
exports.OAuthClientEntity = OAuthClientEntity = __decorate([
    (0, typeorm_1.Entity)(`${constants_1.OAUTH_TABLE_PREFIX}clients`)
], OAuthClientEntity);
//# sourceMappingURL=oauth-client.entity.js.map