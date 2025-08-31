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

const GUADELOUPE_TIMEZONE = 'America/Guadeloupe';

@ValidatorConstraint({ async: false })
export class IsValidBookingDateConstraint
  implements ValidatorConstraintInterface
{
  validate(dateString: string) {
    if (!dateString) return false;

    try {
      // Convertir la date UTC reçue en heure Guadeloupe
      const appointmentDate = dayjs.utc(dateString).tz(GUADELOUPE_TIMEZONE);
      const now = dayjs().tz(GUADELOUPE_TIMEZONE);

      // Date minimale : demain
      const minDate = now.add(1, 'day').hour(0).minute(0).second(0);

      // Date maximale : dans 1 mois
      const maxDate = now.add(1, 'month').hour(23).minute(59).second(59);

      // Vérifier que la date est dans la plage autorisée
      return (
        appointmentDate.isAfter(minDate) && appointmentDate.isBefore(maxDate)
      );
    } catch (error) {
      return false;
    }
  }

  defaultMessage() {
    return "La date de rendez-vous doit être comprise entre demain et un mois à partir d'aujourd'hui";
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
