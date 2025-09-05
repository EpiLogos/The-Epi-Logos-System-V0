/**
 * GraphQL-specific type definitions
 */

// GraphQL operation types
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: {
    code?: string;
    errorId?: string;
    [key: string]: any;
  };
}

// Subscription types
export interface GraphQLSubscription<T = any> {
  subscribe: () => AsyncIterator<T>;
  unsubscribe: () => void;
}

// Federation types
export interface SubgraphConfig {
  name: string;
  url: string;
  schema: string;
}

export interface FederatedSchema {
  subgraphs: SubgraphConfig[];
  gateway: {
    url: string;
    introspection: boolean;
  };
}
