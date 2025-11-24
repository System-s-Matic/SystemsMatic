import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { QueueModule } from './queue/queue.module';
import { BackofficeModule } from './backoffice/backoffice.module';
import { AuthModule } from './auth/auth.module';
import { QuotesModule } from './quotes/quotes.module';
import { EmailActionsModule } from './email-actions/email-actions.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AppointmentsModule,
    MailModule,
    QueueModule,
    BackofficeModule,
    AuthModule,
    QuotesModule,
    EmailActionsModule,
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
