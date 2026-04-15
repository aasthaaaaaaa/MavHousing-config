import { HttpAdapter } from '../interfaces/http-adapter.interface';
export declare class HttpAdapterFactory {
    private static expressAdapter;
    private static fastifyAdapter;
    static getAdapter(req: any, res: any): HttpAdapter;
    private static isExpressRequest;
    private static isExpressResponse;
    private static isFastifyRequest;
    private static isFastifyReply;
}
//# sourceMappingURL=http-adapter.factory.d.ts.map