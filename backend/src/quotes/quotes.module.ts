import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuoteEmailService } from './quote-email.service';
import { QuoteManagementService } from './quote-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuoteEmailService, QuoteManagementService],
  exports: [QuotesService, QuoteEmailService, QuoteManagementService],
})
export class QuotesModule {}
