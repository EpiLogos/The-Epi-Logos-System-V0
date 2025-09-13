/**
 * Database and data layer type definitions
 */

// Database connection types
export interface DatabaseConfig {
  type: 'neo4j' | 'mongodb' | 'redis' | 'qdrant';
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  options?: Record<string, unknown>;
}

// Neo4j specific types
export interface Neo4jQuery {
  cypher: string;
  parameters?: Record<string, unknown>;
}

export interface Neo4jResult {
  records: unknown[];
  summary: {
    queryType: string;
    counters: Record<string, number>;
    plan?: unknown;
    profile?: unknown;
    notifications?: unknown[];
  };
}

// MongoDB specific types
export interface MongoQuery {
  collection: string;
  operation: 'find' | 'findOne' | 'insertOne' | 'insertMany' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany';
  filter?: Record<string, unknown>;
  document?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

// Redis specific types
export interface RedisOperation {
  command: string;
  key: string;
  value?: unknown;
  options?: {
    ttl?: number;
    nx?: boolean;
    xx?: boolean;
  };
}

// Qdrant specific types
export interface QdrantVector {
  id: string | number;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface QdrantSearchParams {
  vector: number[];
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
  with_payload?: boolean;
  with_vector?: boolean;
  score_threshold?: number;
}

// Generic query result types
export interface QueryResult<T = unknown> {
  data: T;
  metadata: {
    executionTime: number;
    recordCount: number;
    database: string;
    query: string;
  };
}
