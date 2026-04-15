"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEndpoint = normalizeEndpoint;
function normalizeEndpoint(endpoint) {
    try {
        if (!endpoint) {
            return '';
        }
        const protocolMatch = endpoint.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
        if (protocolMatch) {
            const protocol = protocolMatch[0];
            const pathPart = endpoint.slice(protocol.length);
            const normalizedPath = pathPart.replace(/\/+/g, '/');
            const result = protocol + normalizedPath;
            return result;
        }
        else {
            const normalized = endpoint.replace(/\/+/g, '/');
            const result = normalized.startsWith('/')
                ? normalized.slice(1)
                : normalized;
            return result;
        }
    }
    catch (error) {
        console.error('Error normalizing endpoint:', error);
        return '';
    }
}
//# sourceMappingURL=normalize-endpoint.js.map