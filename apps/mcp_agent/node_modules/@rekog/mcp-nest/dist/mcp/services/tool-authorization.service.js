"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolAuthorizationService = void 0;
const common_1 = require("@nestjs/common");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
let ToolAuthorizationService = class ToolAuthorizationService {
    generateSecuritySchemes(tool, moduleHasGuards) {
        const metadata = tool.metadata;
        const schemes = [];
        if (metadata.isPublic) {
            schemes.push({ type: 'noauth' });
        }
        if (metadata.requiredScopes && metadata.requiredScopes.length > 0) {
            schemes.push({ type: 'oauth2', scopes: metadata.requiredScopes });
        }
        else if (moduleHasGuards && !metadata.isPublic) {
            schemes.push({ type: 'oauth2' });
        }
        if (schemes.length === 0) {
            schemes.push({ type: 'noauth' });
        }
        return schemes;
    }
    canAccessTool(user, tool, moduleHasGuards, allowUnauthenticatedAccess = false) {
        const metadata = tool.metadata;
        if (metadata.isPublic) {
            return true;
        }
        const hasSpecificRequirements = (metadata.requiredScopes && metadata.requiredScopes.length > 0) ||
            (metadata.requiredRoles && metadata.requiredRoles.length > 0);
        if (hasSpecificRequirements && !user) {
            return false;
        }
        if (metadata.requiredScopes && metadata.requiredScopes.length > 0) {
            if (!this.hasRequiredScopes(user, metadata.requiredScopes)) {
                return false;
            }
        }
        if (metadata.requiredRoles && metadata.requiredRoles.length > 0) {
            if (!this.hasRequiredRoles(user, metadata.requiredRoles)) {
                return false;
            }
        }
        if (allowUnauthenticatedAccess && moduleHasGuards && !user) {
            return false;
        }
        return true;
    }
    validateToolAccess(user, tool, moduleHasGuards, allowUnauthenticatedAccess = false) {
        const metadata = tool.metadata;
        const toolName = metadata.name;
        if (metadata.isPublic) {
            return;
        }
        const hasSpecificRequirements = (metadata.requiredScopes && metadata.requiredScopes.length > 0) ||
            (metadata.requiredRoles && metadata.requiredRoles.length > 0);
        if (hasSpecificRequirements && !user) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Tool '${toolName}' requires authentication`);
        }
        if (metadata.requiredScopes && metadata.requiredScopes.length > 0) {
            if (!this.hasRequiredScopes(user, metadata.requiredScopes)) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Tool '${toolName}' requires scopes: ${metadata.requiredScopes.join(', ')}`);
            }
        }
        if (metadata.requiredRoles && metadata.requiredRoles.length > 0) {
            if (!this.hasRequiredRoles(user, metadata.requiredRoles)) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Tool '${toolName}' requires roles: ${metadata.requiredRoles.join(', ')}`);
            }
        }
        if (allowUnauthenticatedAccess && moduleHasGuards && !user) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Tool '${toolName}' requires authentication`);
        }
    }
    hasRequiredScopes(user, requiredScopes) {
        if (!user) {
            return false;
        }
        let userScopes = [];
        if (user.scope) {
            userScopes = user.scope.split(' ').filter((s) => s.length > 0);
        }
        else if (user.scopes && Array.isArray(user.scopes)) {
            userScopes = user.scopes;
        }
        return requiredScopes.every((required) => userScopes.includes(required));
    }
    hasRequiredRoles(user, requiredRoles) {
        if (!user) {
            return false;
        }
        let userRoles = [];
        if (user.roles && Array.isArray(user.roles)) {
            userRoles = user.roles;
        }
        else if (user.user_data &&
            user.user_data.roles &&
            Array.isArray(user.user_data.roles)) {
            userRoles = user.user_data.roles;
        }
        return requiredRoles.every((required) => userRoles.includes(required));
    }
};
exports.ToolAuthorizationService = ToolAuthorizationService;
exports.ToolAuthorizationService = ToolAuthorizationService = __decorate([
    (0, common_1.Injectable)()
], ToolAuthorizationService);
//# sourceMappingURL=tool-authorization.service.js.map