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
  options?: Record<string, any>;
}

// Neo4j specific types
export interface Neo4jQuery {
  cypher: string;
  parameters?: Record<string, any>;
}

export interface Neo4jResult {
  records: any[];
  summary: {
    queryType: string;
    counters: Record<string, number>;
    plan?: any;
    profile?: any;
    notifications?: any[];
  };
}

// MongoDB specific types
export interface MongoQuery {
  collection: string;
  operation: 'find' | 'findOne' | 'insertOne' | 'insertMany' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany';
  filter?: Record<string, any>;
  document?: Record<string, any>;
  options?: Record<string, any>;
}

// Redis specific types
export interface RedisOperation {
  command: string;
  key: string;
  value?: any;
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
  payload?: Record<string, any>;
}

export interface QdrantSearchParams {
  vector: number[];
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
  with_payload?: boolean;
  with_vector?: boolean;
  score_threshold?: number;
}

// Generic query result types
export interface QueryResult<T = any> {
  data: T;
  metadata: {
    executionTime: number;
    recordCount: number;
    database: string;
    query: string;
  };
}
