import type { Request } from 'express';
import type { JwtPayload } from '../services/jwt-token.service';
export type McpUserPayload = JwtPayload & {
    name?: string;
    username?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
};
export type McpRequestWithUser = Request & {
    user: McpUserPayload;
};
//# sourceMappingURL=request-with-user.d.ts.map