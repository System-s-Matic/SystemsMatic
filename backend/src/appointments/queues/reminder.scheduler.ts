import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReminderScheduler {
  constructor(@InjectQueue('reminders') private readonly queue: Queue) {}

  async scheduleReminder(appt: { id: string; scheduledAt: Date | null }) {
    if (!appt.scheduledAt) return null;
    const runAt = new Date(appt.scheduledAt.getTime() - 24 * 3600 * 1000);
    const delay = runAt.getTime() - Date.now();
    if (delay <= 0) return null; // trop tard → ne rien planifier

    const job = await this.queue.add(
      'reminder',
      { appointmentId: appt.id },
      { delay },
    );
    return job.id?.toString() ?? null;
  }

  async cancelReminder(jobId?: string | null) {
    if (!jobId) return;
    try {
      await this.queue.remove(jobId);
    } catch {
      throw new Error('Job not found');
    }
  }
}
