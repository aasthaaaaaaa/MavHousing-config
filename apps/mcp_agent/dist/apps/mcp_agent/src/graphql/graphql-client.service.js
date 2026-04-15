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
var GraphqlClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphqlClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GraphqlClientService = GraphqlClientService_1 = class GraphqlClientService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(GraphqlClientService_1.name);
        const baseUrl = this.config.get('INTERNAL_API_URL') || 'http://localhost:3009';
        this.graphqlUrl = `${baseUrl}/graphql`;
    }
    async query(queryStr, variables) {
        try {
            const response = await fetch(this.graphqlUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryStr, variables }),
            });
            if (!response.ok) {
                this.logger.error(`GraphQL request failed: ${response.status} ${response.statusText}`);
                return null;
            }
            const result = await response.json();
            if (result.errors) {
                this.logger.error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
                return null;
            }
            return result.data;
        }
        catch (error) {
            this.logger.error(`GraphQL connection error: ${error}`);
            return null;
        }
    }
    async healthCheck() {
        const result = await this.query('{ hello }');
        return result !== null;
    }
};
exports.GraphqlClientService = GraphqlClientService;
exports.GraphqlClientService = GraphqlClientService = GraphqlClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GraphqlClientService);
//# sourceMappingURL=graphql-client.service.js.map