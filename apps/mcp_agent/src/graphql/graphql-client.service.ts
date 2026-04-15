import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GraphqlClientService {
  private readonly logger = new Logger(GraphqlClientService.name);
  private readonly graphqlUrl: string;

  constructor(private readonly config: ConfigService) {
    const baseUrl = this.config.get<string>('INTERNAL_API_URL') || 'http://localhost:3009';
    this.graphqlUrl = `${baseUrl}/graphql`;
  }

  /**
   * Execute a GraphQL query against the internal-api.
   * Uses native fetch for simplicity.
   */
  async query<T = any>(queryStr: string, variables?: Record<string, any>): Promise<T | null> {
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

      const result = await response.json() as any;

      if (result.errors) {
        this.logger.error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        return null;
      }

      return result.data as T;
    } catch (error) {
      this.logger.error(`GraphQL connection error: ${error}`);
      return null;
    }
  }

  /**
   * Check if the GraphQL endpoint is reachable.
   */
  async healthCheck(): Promise<boolean> {
    const result = await this.query<{ hello: string }>('{ hello }');
    return result !== null;
  }
}
