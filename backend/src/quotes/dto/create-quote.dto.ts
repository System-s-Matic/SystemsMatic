import {
  IsString,
  IsEmail,
  IsBoolean,
  IsNotEmpty,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'Prénom du client',
    example: 'Jean',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({
    description: 'Nom du client',
    example: 'Dupont',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  lastName: string;

  @ApiProperty({
    description: 'Email du client',
    example: 'jean.dupont@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Numéro de téléphone (requis si acceptPhone est true)',
    example: '+33123456789',
    required: false,
  })
  @ValidateIf((o) => o.acceptPhone || o.phone)
  @IsString()
  @IsNotEmpty({
    message:
      "Un numéro de téléphone est requis si vous acceptez d'être recontacté par téléphone",
  })
  @Matches(/^[\d\s\-\+\(\)]{10,}$/, {
    message: 'Le numéro de téléphone doit être valide',
  })
  phone?: string;

  @ApiProperty({
    description: 'Message décrivant la demande',
    example: 'Je souhaite un devis pour...',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  message: string;

  @ApiProperty({
    description: "Acceptation d'être recontacté par téléphone",
    example: true,
  })
  @IsBoolean()
  acceptPhone: boolean;

  @ApiProperty({
    description: 'Acceptation des conditions générales',
    example: true,
  })
  @IsBoolean()
  acceptTerms: boolean;
}
