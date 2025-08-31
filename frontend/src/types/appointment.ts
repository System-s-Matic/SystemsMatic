export enum AppointmentReason {
  DIAGNOSTIC = "DIAGNOSTIC",
  INSTALLATION = "INSTALLATION",
  MAINTENANCE = "MAINTENANCE",
  AUTRE = "AUTRE",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export interface CreateAppointmentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  reason?: AppointmentReason;
  reasonOther?: string;
  message?: string;
  consent: boolean;
}

export interface Appointment {
  id: string;
  contactId: string;
  reason?: AppointmentReason;
  reasonOther?: string;
  message?: string;
  status: AppointmentStatus;
  scheduledAt?: Date;
  durationMinutes: number;
  timezone: string;
  location?: string;
  confirmationToken: string;
  cancellationToken: string;
  confirmedAt?: Date;
  cancelledAt?: Date;
  reminderJobId?: string;
  reminderScheduledAt?: Date;
  reminderSentAt?: Date;
  lastEmailAt?: Date;
  createdIp?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  consentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
