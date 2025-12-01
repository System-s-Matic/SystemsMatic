import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  PrometheusModule,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { QueueMonitorService } from './queue-monitor.service';
import { QueueMetricsService } from './queue-metrics.service';

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT ?? 6379),
    };

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
    BullModule.forRoot({
      connection,
      defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 1000 },
    }),
    BullModule.registerQueue({ name: 'reminders' }),
  ],
  providers: [
    QueueMonitorService,
    QueueMetricsService,
    makeGaugeProvider({
      name: 'bullmq_reminders_waiting',
      help: 'Nombre de jobs en attente dans la queue BullMQ reminders',
    }),
  ],
  exports: [BullModule, QueueMonitorService],
})
export class QueueModule {}
