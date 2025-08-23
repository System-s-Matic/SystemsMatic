import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID unique de l\'utilisateur' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Email de l\'utilisateur' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Nom d\'utilisateur' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({ description: 'Mot de passe hashé' })
  @Column()
  password: string;

  @ApiProperty({ description: 'Prénom de l\'utilisateur' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'Nom de famille de l\'utilisateur' })
  @Column()
  lastName: string;

  @ApiProperty({ description: 'Date de création du compte' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  @UpdateDateColumn()
  updatedAt: Date;
}
