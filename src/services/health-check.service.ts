import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  components: ComponentHealth[];
}

export class HealthCheckService {
  async checkDatabase(): Promise<ComponentHealth> {
    // Mock database check - in a real implementation, this would check actual database connectivity
    try {
      // Simulate a database check
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        name: 'database',
        status: 'healthy'
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkFilesystem(): Promise<ComponentHealth> {
    try {
      // Check if we can read/write to filesystem
      await fs.access('.');
      return {
        name: 'filesystem',
        status: 'healthy'
      };
    } catch (error) {
      return {
        name: 'filesystem',
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkExternalAPIs(): Promise<ComponentHealth> {
    // Mock external API check
    try {
      // Simulate an external API check
      await new Promise(resolve => setTimeout(resolve, 20));
      return {
        name: 'external-apis',
        status: 'healthy'
      };
    } catch (error) {
      return {
        name: 'external-apis',
        status: 'degraded',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkSystemResources(): Promise<ComponentHealth> {
    try {
      const { stdout } = await execPromise('node -v');
      if (stdout) {
        return {
          name: 'system-resources',
          status: 'healthy'
        };
      }
      return {
        name: 'system-resources',
        status: 'degraded',
        details: 'Node.js version check returned empty result'
      };
    } catch (error) {
      return {
        name: 'system-resources',
        status: 'degraded',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const components: ComponentHealth[] = [];
    
    // Run all checks concurrently
    const checks = [
      this.checkDatabase(),
      this.checkFilesystem(),
      this.checkExternalAPIs(),
      this.checkSystemResources()
    ];
    
    const results = await Promise.all(checks);
    components.push(...results);
    
    // Determine overall status
    const hasUnhealthy = components.some(c => c.status === 'unhealthy');
    const hasDegraded = components.some(c => c.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components
    };
  }

  // Simple liveness check - if this function can run, the service is alive
  async livenessCheck(): Promise<boolean> {
    return true;
  }

  // Readiness check - verifies the service is ready to handle requests
  async readinessCheck(): Promise<boolean> {
    try {
      // Check essential services for readiness
      const database = await this.checkDatabase();
      const filesystem = await this.checkFilesystem();
      
      return database.status === 'healthy' && filesystem.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}