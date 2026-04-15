"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAdapterFactory = void 0;
const express_http_adapter_1 = require("./express-http.adapter");
const fastify_http_adapter_1 = require("./fastify-http.adapter");
class HttpAdapterFactory {
    static getAdapter(req, res) {
        if (this.isExpressRequest(req) && this.isExpressResponse(res)) {
            if (!this.expressAdapter) {
                this.expressAdapter = new express_http_adapter_1.ExpressHttpAdapter();
            }
            return this.expressAdapter;
        }
        if (this.isFastifyRequest(req) && this.isFastifyReply(res)) {
            if (!this.fastifyAdapter) {
                this.fastifyAdapter = new fastify_http_adapter_1.FastifyHttpAdapter();
            }
            return this.fastifyAdapter;
        }
        if (!this.expressAdapter) {
            this.expressAdapter = new express_http_adapter_1.ExpressHttpAdapter();
        }
        return this.expressAdapter;
    }
    static isExpressRequest(req) {
        return Boolean(req &&
            typeof req === 'object' &&
            typeof req.get === 'function' &&
            req.method !== undefined &&
            req.url !== undefined &&
            !req.routeOptions);
    }
    static isExpressResponse(res) {
        return Boolean(res &&
            typeof res === 'object' &&
            typeof res.status === 'function' &&
            typeof res.json === 'function' &&
            typeof res.send === 'function' &&
            res.headersSent !== undefined &&
            !res.sent);
    }
    static isFastifyRequest(req) {
        return Boolean(req &&
            typeof req === 'object' &&
            req.routeOptions !== undefined &&
            req.method !== undefined &&
            req.url !== undefined);
    }
    static isFastifyReply(res) {
        return Boolean(res &&
            typeof res === 'object' &&
            typeof res.status === 'function' &&
            typeof res.send === 'function' &&
            typeof res.header === 'function' &&
            res.sent !== undefined);
    }
}
exports.HttpAdapterFactory = HttpAdapterFactory;
HttpAdapterFactory.expressAdapter = null;
HttpAdapterFactory.fastifyAdapter = null;
//# sourceMappingURL=http-adapter.factory.js.map