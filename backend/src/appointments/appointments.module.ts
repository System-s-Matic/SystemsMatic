import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueModule } from '../queue/queue.module';
import { ReminderProcessor } from './queues/reminder.processor';
import { ReminderScheduler } from './queues/reminder.scheduler';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [QueueModule, MailModule],
  controllers: [AppointmentsController, AdminAppointmentsController],
  providers: [
    AppointmentsService,
    PrismaService,
    ReminderProcessor,
    ReminderScheduler,
  ],
})
export class AppointmentsModule {}
