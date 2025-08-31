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
  requestedAt: string;
  consent: boolean;
}

export interface ConfirmAppointmentDto {
  scheduledAt: string;
}

export interface Appointment {
  id: string;
  contactId: string;
  reason?: AppointmentReason;
  reasonOther?: string;
  message?: string;
  requestedAt: Date;
  status: AppointmentStatus;
  scheduledAt?: Date;
  timezone: string;
  confirmationToken: string;
  cancellationToken: string;
  confirmedAt?: Date;
  cancelledAt?: Date;
  createdIp?: string;
  createdAt: Date;
  updatedAt: Date;
  contact: Contact;
  emailLogs?: EmailLog[];
  reminders?: Reminder[];
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

export interface EmailLog {
  id: string;
  appointmentId?: string;
  to: string;
  subject: string;
  template: string;
  sentAt: Date;
  meta?: any;
}

export interface Reminder {
  id: string;
  appointmentId: string;
  dueAt: Date;
  sentAt?: Date;
  providerRef?: string;
  createdAt: Date;
}
