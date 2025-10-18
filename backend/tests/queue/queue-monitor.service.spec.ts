import { QueueMonitorService } from '../../src/queue/queue-monitor.service';
import { Queue } from 'bullmq';

describe('QueueMonitorService', () => {
  let service: QueueMonitorService;
  let mockQueue: Partial<Queue>;

  beforeEach(() => {
    mockQueue = {
      getWaiting: jest.fn().mockResolvedValue([{ id: 1 }]),
      getActive: jest.fn().mockResolvedValue([{ id: 2 }, { id: 3 }]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([{ id: 4 }]),
    };

    service = new QueueMonitorService(mockQueue as Queue);
  });

  it('retourne des statistiques correctes', async () => {
    const stats = await service.getQueueStats();

    expect(stats.waiting).toBe(1);
    expect(stats.active).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.total).toBe(4);
    expect(stats.memoryUsage.waiting).toBe(150);
    expect(stats.memoryUsage.active).toBe(300);
  });

  it('gère une erreur de récupération de la queue', async () => {
    (mockQueue.getWaiting as jest.Mock).mockRejectedValueOnce(
      new Error('Redis down'),
    );
    const stats = await service.getQueueStats();

    expect(stats.error).toContain('Impossible de récupérer');
    expect(stats.details).toBe('Redis down');
  });

  it('retourne un état healthy', async () => {
    const health = await service.getQueueHealth();

    expect(health.status).toBe('healthy');
    expect(health.memoryUsage).toHaveProperty('total');
    expect(health.memoryUsage).toHaveProperty('usagePercent');
    expect(Number(health.memoryUsage.usagePercent)).toBeGreaterThanOrEqual(0);
  });

  it('retourne un état error quand il y a une erreur dans getQueueStats', async () => {
    // Arrange
    (mockQueue.getWaiting as jest.Mock).mockRejectedValueOnce(
      new Error('Redis connection failed'),
    );

    // Act
    const health = await service.getQueueHealth();

    // Assert
    expect(health.status).toBe('error');
    expect(health.message).toContain('Impossible de récupérer');
    expect(health.details).toBe('Redis connection failed');
  });
});
