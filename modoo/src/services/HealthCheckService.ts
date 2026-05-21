import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import i18n from '../i18n';
import { API_CONFIG, STORAGE_KEYS } from '../config/env';
import { logger } from '../utils/logger';

const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 分钟
const CONNECTIVITY_CHECK_INTERVAL = 30 * 1000; // 30 秒

export type ConnectionStatus = 'online' | 'offline' | 'checking';

export interface HealthCheckResult {
  success: boolean;
  status: number;
  timestamp: number;
  latency: number;
  error?: string;
}

interface HealthStore {
  connectionStatus: ConnectionStatus;
  lastHealthCheck: HealthCheckResult | null;
  isHealthy: boolean;
  latency: number;
  consecutiveFailures: number;
  checkHealth: () => Promise<HealthCheckResult>;
  updateConnectionStatus: (status: ConnectionStatus) => void;
  clearState: () => void;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const useHealthStore = create<HealthStore>((set, get) => ({
  connectionStatus: 'checking',
  lastHealthCheck: null,
  isHealthy: true,
  latency: 0,
  consecutiveFailures: 0,

  checkHealth: async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      set({ connectionStatus: 'checking' });

      const apiUrl = API_CONFIG.BASE_URL;
      logger.debug(`[HealthCheck] Making request to: ${apiUrl}/health`);

      const response = await fetchWithTimeout(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      logger.debug(`[HealthCheck] Response status: ${response.status}`);

      const latency = Date.now() - startTime;

      if (response.ok) {
        result = {
          success: true,
          status: response.status,
          timestamp: Date.now(),
          latency,
        };

        set({
          isHealthy: true,
          lastHealthCheck: result,
          latency,
          consecutiveFailures: 0,
          connectionStatus: 'online',
        });
      } else {
        result = {
          success: false,
          status: response.status,
          timestamp: Date.now(),
          latency,
          error: i18n.t('healthCheck.serverError'),
        };

        const previousFailures = get().consecutiveFailures;
        set({
          isHealthy: false,
          lastHealthCheck: result,
          latency,
          consecutiveFailures: previousFailures + 1,
          connectionStatus: previousFailures >= 2 ? 'offline' : 'checking',
        });
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage =
        error instanceof Error && error.name === 'AbortError'
          ? i18n.t('healthCheck.timeout')
          : error instanceof Error
            ? error.message
            : i18n.t('healthCheck.networkError');

      result = {
        success: false,
        status: 0,
        timestamp: Date.now(),
        latency,
        error: errorMessage,
      };

      const previousFailures = get().consecutiveFailures;
      const isOffline = previousFailures >= 2;

      set({
        isHealthy: false,
        lastHealthCheck: result,
        latency,
        consecutiveFailures: previousFailures + 1,
        connectionStatus: isOffline ? 'offline' : 'checking',
      });
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_CHECK, JSON.stringify(result));
    } catch (e) {
      logger.error('Failed to save health check result', { e });
    }

    return result;
  },

  updateConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status });
  },

  clearState: () => {
    set({
      lastHealthCheck: null,
      consecutiveFailures: 0,
    });
  },
}));

class HealthCheckService {
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private connectivityTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.initialized = true;

    try {
      const savedCheck = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_CHECK);
      if (savedCheck) {
        const result: HealthCheckResult = JSON.parse(savedCheck);
        const timeSince = Date.now() - result.timestamp;
        const isRecent = timeSince < HEALTH_CHECK_INTERVAL;

        useHealthStore.setState({
          lastHealthCheck: result,
          isHealthy: result.success && isRecent,
          latency: result.latency,
          connectionStatus: result.success && isRecent ? 'online' : 'checking',
        });
      }
    } catch (e) {
      logger.error('Failed to load health check state', { e });
    }

    try {
      await this.checkHealth();
    } catch (e) {
      logger.error('Initial health check failed', { e });
    }

    this.startTimers();
  }

  destroy(): void {
    this.stopTimers();
    this.initialized = false;
  }

  private startTimers(): void {
    this.healthCheckTimer = setInterval(() => {
      this.checkHealth().catch(() => {});
    }, HEALTH_CHECK_INTERVAL);

    this.connectivityTimer = setInterval(() => {
      this.checkConnectivity().catch(() => {});
    }, CONNECTIVITY_CHECK_INTERVAL);
  }

  private stopTimers(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.connectivityTimer) {
      clearInterval(this.connectivityTimer);
      this.connectivityTimer = null;
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    return await useHealthStore.getState().checkHealth();
  }

  async checkConnectivity(): Promise<void> {
    try {
      const { connectionStatus } = useHealthStore.getState();
      if (connectionStatus === 'offline') {
        await this.checkHealth();
      }
    } catch {
      // Health check polling errors are non-critical
    }
  }

  isHealthy(): boolean {
    return useHealthStore.getState().isHealthy;
  }

  isOnline(): boolean {
    return useHealthStore.getState().connectionStatus === 'online';
  }

  getLatency(): number {
    return useHealthStore.getState().latency;
  }

  getConsecutiveFailures(): number {
    return useHealthStore.getState().consecutiveFailures;
  }

  getConnectionStatus(): ConnectionStatus {
    return useHealthStore.getState().connectionStatus;
  }
}

export const healthCheckService = new HealthCheckService();
export default healthCheckService;
