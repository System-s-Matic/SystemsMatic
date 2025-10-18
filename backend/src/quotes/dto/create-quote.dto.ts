import {
  IsString,
  IsEmail,
  IsBoolean,
  IsNotEmpty,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

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

  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  message: string;

  @IsBoolean()
  acceptPhone: boolean;

  @IsBoolean()
  acceptTerms: boolean;
}
