import { Citation } from './types';

interface UsageStats {
  totalRequests: number;
  requestsByHour: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  topQueries: Array<{ query: string; count: number }>;
  citationsUsed: Record<string, number>;
}

class MonitoringService {
  private stats: UsageStats = {
    totalRequests: 0,
    requestsByHour: {},
    averageResponseTime: 0,
    errorRate: 0,
    topQueries: [],
    citationsUsed: {}
  };

  private responseTimes: number[] = [];
  private errors: number = 0;

  trackRequest(query: string, responseTime: number, citations: Citation[], error: boolean = false) {
    this.stats.totalRequests++;

    // Track by hour
    const hour = new Date().toISOString().slice(0, 13);
    this.stats.requestsByHour[hour] = (this.stats.requestsByHour[hour] || 0) + 1;

    // Track response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift(); // Keep only last 1000
    }
    this.stats.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Track errors
    if (error) this.errors++;
    this.stats.errorRate = this.errors / this.stats.totalRequests;

    // Track top queries
    const existingQuery = this.stats.topQueries.find(q => q.query === query);
    if (existingQuery) {
      existingQuery.count++;
    } else {
      this.stats.topQueries.push({ query, count: 1 });
    }
    this.stats.topQueries.sort((a, b) => b.count - a.count);
    this.stats.topQueries = this.stats.topQueries.slice(0, 10); // Keep top 10

    // Track citations
    citations.forEach(citation => {
      const filename = citation.filename;
      this.stats.citationsUsed[filename] = (this.stats.citationsUsed[filename] || 0) + 1;
    });
  }

  getStats(): UsageStats {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      totalRequests: 0,
      requestsByHour: {},
      averageResponseTime: 0,
      errorRate: 0,
      topQueries: [],
      citationsUsed: {}
    };
    this.responseTimes = [];
    this.errors = 0;
  }
}

export const monitoring = new MonitoringService();