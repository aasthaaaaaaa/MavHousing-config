"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceTemplate = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("./constants");
const ResourceTemplate = (options) => {
    return (0, common_1.SetMetadata)(constants_1.MCP_RESOURCE_TEMPLATE_METADATA_KEY, options);
};
exports.ResourceTemplate = ResourceTemplate;
//# sourceMappingURL=resource-template.decorator.js.map