"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicTool = exports.MCP_PUBLIC_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MCP_PUBLIC_METADATA_KEY = 'mcp:public-tool';
const PublicTool = () => (0, common_1.SetMetadata)(exports.MCP_PUBLIC_METADATA_KEY, true);
exports.PublicTool = PublicTool;
//# sourceMappingURL=public.decorator.js.map