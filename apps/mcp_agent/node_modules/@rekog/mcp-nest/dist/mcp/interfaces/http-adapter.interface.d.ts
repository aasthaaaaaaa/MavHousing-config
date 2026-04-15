export interface HttpRequest {
    url?: string;
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, any>;
    body?: any;
    params?: Record<string, string>;
    get?(name: string): string | undefined;
    raw?: any;
}
export interface HttpResponse {
    status(code: number): this;
    json(body: any): this | void;
    send(body: string): this | void;
    write(chunk: any): boolean | void;
    setHeader?(name: string, value: string | string[]): void;
    readonly headersSent?: boolean;
    readonly writable?: boolean;
    readonly closed?: boolean;
    on?(event: string, listener: (...args: any[]) => void): void;
    raw?: any;
}
export interface HttpAdapter {
    adaptRequest(req: any): HttpRequest;
    adaptResponse(res: any): HttpResponse;
}
//# sourceMappingURL=http-adapter.interface.d.ts.map