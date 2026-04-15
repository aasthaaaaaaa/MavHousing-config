"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolScopes = exports.MCP_SCOPES_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MCP_SCOPES_METADATA_KEY = 'mcp:scopes';
const ToolScopes = (scopes) => {
    if (!Array.isArray(scopes) || scopes.length === 0) {
        throw new Error('@ToolScopes() requires a non-empty array of scope strings');
    }
    return (0, common_1.SetMetadata)(exports.MCP_SCOPES_METADATA_KEY, scopes);
};
exports.ToolScopes = ToolScopes;
//# sourceMappingURL=require-scopes.decorator.js.map