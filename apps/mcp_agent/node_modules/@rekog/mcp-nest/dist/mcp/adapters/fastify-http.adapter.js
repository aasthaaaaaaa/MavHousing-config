"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastifyHttpAdapter = void 0;
class FastifyHttpAdapter {
    adaptRequest(req) {
        return {
            url: req.url,
            method: req.method,
            headers: req.headers,
            query: req.query,
            body: req.body,
            params: req.params,
            get: (name) => {
                const value = req.headers[name.toLowerCase()];
                return Array.isArray(value) ? value[0] : value;
            },
            raw: req.raw,
        };
    }
    adaptResponse(res) {
        return {
            status: (code) => {
                res.status(code);
                return this.adaptResponse(res);
            },
            json: (body) => {
                void res.send(body);
                return this.adaptResponse(res);
            },
            send: (body) => {
                void res.send(body);
                return this.adaptResponse(res);
            },
            write: (chunk) => {
                void res.raw.write(chunk);
            },
            setHeader: (name, value) => {
                res.header(name, value);
            },
            get headersSent() {
                return res.sent;
            },
            get writable() {
                return !res.sent;
            },
            get closed() {
                return res.sent;
            },
            on: (event, listener) => {
                res.raw.on(event, listener);
            },
            raw: res.raw,
        };
    }
}
exports.FastifyHttpAdapter = FastifyHttpAdapter;
//# sourceMappingURL=fastify-http.adapter.js.map