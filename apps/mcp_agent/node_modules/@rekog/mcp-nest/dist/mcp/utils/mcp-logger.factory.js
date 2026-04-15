"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpLogger = createMcpLogger;
const common_1 = require("@nestjs/common");
class FilteredLogger extends common_1.Logger {
    constructor(context, enabledLevels) {
        super(context);
        this.enabledLevels = new Set(enabledLevels);
    }
    log(message, context) {
        if (this.enabledLevels.has('log')) {
            super.log(message, context);
        }
    }
    error(message, ...optionalParams) {
        if (this.enabledLevels.has('error')) {
            super.error(message, ...optionalParams);
        }
    }
    warn(message, context) {
        if (this.enabledLevels.has('warn')) {
            super.warn(message, context);
        }
    }
    debug(message, context) {
        if (this.enabledLevels.has('debug')) {
            super.debug(message, context);
        }
    }
    verbose(message, context) {
        if (this.enabledLevels.has('verbose')) {
            super.verbose(message, context);
        }
    }
}
class NoOpLogger extends common_1.Logger {
    log(message, context) {
    }
    error(message, ...optionalParams) {
    }
    warn(message, context) {
    }
    debug(message, context) {
    }
    verbose(message, context) {
    }
}
function createMcpLogger(context, options) {
    if (!options || options.logging === undefined) {
        return new common_1.Logger(context);
    }
    if (options.logging === false) {
        return new NoOpLogger(context);
    }
    if (options.logging.level && Array.isArray(options.logging.level)) {
        return new FilteredLogger(context, options.logging.level);
    }
    return new common_1.Logger(context);
}
//# sourceMappingURL=mcp-logger.factory.js.map