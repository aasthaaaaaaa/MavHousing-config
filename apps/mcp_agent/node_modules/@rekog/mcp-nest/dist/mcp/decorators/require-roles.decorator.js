"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRoles = exports.MCP_ROLES_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MCP_ROLES_METADATA_KEY = 'mcp:roles';
const ToolRoles = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error('@ToolRoles() requires a non-empty array of role strings');
    }
    return (0, common_1.SetMetadata)(exports.MCP_ROLES_METADATA_KEY, roles);
};
exports.ToolRoles = ToolRoles;
//# sourceMappingURL=require-roles.decorator.js.map