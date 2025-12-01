import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { QueueMonitorService } from './queue-monitor.service';

@Injectable()
export class QueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private intervalId?: NodeJS.Timeout;

  constructor(
    private readonly queueMonitorService: QueueMonitorService,
    @InjectMetric('bullmq_reminders_waiting')
    private readonly remindersWaitingGauge: Gauge<string>,
  ) {}

  onModuleInit() {
    // Met à jour immédiatement au démarrage
    void this.updateMetrics();

    // Puis met à jour régulièrement
    this.intervalId = setInterval(() => {
      void this.updateMetrics();
    }, 15000); // toutes les 15s
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async updateMetrics() {
    const stats = await this.queueMonitorService.getQueueStats();

    if ('error' in stats) {
      // En cas d'erreur, on met la métrique à 0 pour éviter les valeurs obsolètes
      this.remindersWaitingGauge.set(0);
      return;
    }

    this.remindersWaitingGauge.set(stats.waiting);
  }
}
