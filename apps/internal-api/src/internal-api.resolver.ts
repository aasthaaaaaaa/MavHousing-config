import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class InternalApiResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello World';
  }
}
