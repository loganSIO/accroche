import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

class InstrumentInputDto {
  @IsString()
  instrument!: string;

  @IsIn(['debutant', 'intermediaire', 'avance', 'expert'])
  niveau!: string;
}

class AvailabilityInputDto {
  @IsString()
  jourSemaine!: string;

  @IsIn(['matin', 'apres-midi', 'soir'])
  creneauxJournee!: string;
}

class ZoneInputDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsNumber()
  rayonKm!: number;

  @IsString()
  ville!: string;
}

// DTO de validation — vit dans la couche Présentation, distinct de l'entité
// du Domaine. Peut évoluer (nouveau champ de formulaire) sans toucher au
// métier, et inversement.
export class CreateMusicianDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstrumentInputDto)
  instruments!: InstrumentInputDto[];

  @IsArray()
  @IsString({ each: true })
  styles!: string[];

  @ValidateNested()
  @Type(() => ZoneInputDto)
  zone!: ZoneInputDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityInputDto)
  availabilities!: AvailabilityInputDto[];

  @IsIn(['amateur', 'pro'])
  status!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}