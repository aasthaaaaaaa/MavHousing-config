export type ResourceTemplateOptions = {
    uriTemplate: string;
    name?: string;
    description?: string;
    mimeType?: string;
    _meta?: Record<string, any>;
};
export interface ResourceTemplateMetadata {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
    _meta?: Record<string, any>;
}
export declare const ResourceTemplate: (options: ResourceTemplateOptions) => import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=resource-template.decorator.d.ts.map