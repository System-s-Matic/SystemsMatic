import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Processor('reminders')
export class ReminderProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {
    super();
  }

  // Exécuté par BullMQ à l'échéance du job
  async process(job: Job<{ appointmentId: string }>) {
    const { appointmentId } = job.data;
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { contact: true },
    });
    if (!appt) return;

    await this.mail.sendAppointmentReminder(appt);

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSentAt: new Date() },
    });
  }
}
