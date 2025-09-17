import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const REFERENCE_TIMEZONE = 'America/Guadeloupe'; // Timezone de référence pour les calculs de plage

@ValidatorConstraint({ async: false })
export class IsValidBookingDateConstraint
  implements ValidatorConstraintInterface
{
  validate(dateString: string, args: any) {
    if (!dateString) return false;

    try {
      // Récupérer la timezone depuis l'objet parent (CreateAppointmentDto) - obligatoire
      const timezone = args.object?.timezone;

      if (!timezone) {
        return false; // Timezone obligatoire
      }

      // Convertir la date reçue en utilisant la timezone de l'utilisateur
      const appointmentDate = dayjs.tz(dateString, timezone);
      const now = dayjs().tz(REFERENCE_TIMEZONE);

      // Date minimale : demain en Guadeloupe
      const minDate = now.add(1, 'day').hour(0).minute(0).second(0);

      // Date maximale : dans 1 mois en Guadeloupe
      const maxDate = now.add(1, 'month').hour(23).minute(59).second(59);

      // Convertir les dates limites en timezone de l'utilisateur pour comparaison
      const minDateInUserTz = minDate.tz(timezone);
      const maxDateInUserTz = maxDate.tz(timezone);

      // Vérifier que la date est dans la plage autorisée
      return (
        appointmentDate.isAfter(minDateInUserTz) &&
        appointmentDate.isBefore(maxDateInUserTz)
      );
    } catch (error) {
      return false;
    }
  }

  defaultMessage() {
    return "La date de rendez-vous doit être comprise entre demain et un mois à partir d'aujourd'hui (heure de Guadeloupe)";
  }
}

export function IsValidBookingDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidBookingDateConstraint,
    });
  };
}
