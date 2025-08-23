import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Email de l\'utilisateur', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ description: 'Nom d\'utilisateur', example: 'john_doe' })
  @IsString()
  @MinLength(3, { message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' })
  @MaxLength(20, { message: 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores' })
  username: string;

  @ApiProperty({ description: 'Mot de passe', example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
  })
  password: string;

  @ApiProperty({ description: 'Prénom', example: 'John' })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' })
  firstName: string;

  @ApiProperty({ description: 'Nom de famille', example: 'Doe' })
  @IsString()
  @MinLength(2, { message: 'Le nom de famille doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom de famille ne peut pas dépasser 50 caractères' })
  lastName: string;
}
