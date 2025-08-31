import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT ?? 6379),
    };

@Module({
  imports: [
    BullModule.forRoot({
      connection,
      defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 1000 },
    }),
    BullModule.registerQueue({ name: 'reminders' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
