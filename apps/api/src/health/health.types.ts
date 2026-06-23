export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  database: 'connected' | 'disconnected';
}
