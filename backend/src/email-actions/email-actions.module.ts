import { Module, forwardRef } from '@nestjs/common';
import { EmailActionsController } from './email-actions.controller';
import { EmailActionsService } from './email-actions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { QuotesModule } from '../quotes/quotes.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AppointmentsModule),
    forwardRef(() => QuotesModule),
    forwardRef(() => MailModule),
  ],
  controllers: [EmailActionsController],
  providers: [EmailActionsService],
  exports: [EmailActionsService],
})
export class EmailActionsModule {}
