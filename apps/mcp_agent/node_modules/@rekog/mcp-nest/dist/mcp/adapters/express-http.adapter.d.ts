import type { Request, Response } from 'express';
import { HttpAdapter, HttpRequest, HttpResponse } from '../interfaces/http-adapter.interface';
export declare class ExpressHttpAdapter implements HttpAdapter {
    adaptRequest(req: Request): HttpRequest;
    adaptResponse(res: Response): HttpResponse;
}
//# sourceMappingURL=express-http.adapter.d.ts.map