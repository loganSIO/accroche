import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class ZoneDto {
  @IsNumber() latitude!: number;
  @IsNumber() longitude!: number;
  @IsNumber() rayonKm!: number;
  @IsString() ville!: string;
}

class InstrumentDto {
  @IsString() instrument!: string;
  @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau!: string;
}

class MusicianDto {
  @IsIn(['amateur', 'pro']) status!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => InstrumentDto) instruments!: InstrumentDto[];
  @IsArray() @IsString({ each: true }) styles!: string[];
  @IsArray() @IsString({ each: true }) objective!: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => AvailabilityDto) availabilities!: AvailabilityDto[];
  @IsOptional() @IsString() bio?: string;
}

class AvailabilityDto {
  @IsString() jourSemaine!: string;
  @IsIn(['matin', 'apres-midi', 'soir']) creneauxJournee!: string;
}

class OpenPositionDto {
  @IsString() instrument!: string;
  @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau!: string;
}

class GroupDto {
  @IsString() name!: string;
  @IsArray() @IsString({ each: true }) styles!: string[];
  @IsIn(['association', 'professionnel']) status!: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsString({ each: true }) audioLinks!: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => OpenPositionDto) requestedInstruments!: OpenPositionDto[];
}

export class RegisterAccountDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
  @ValidateNested() @Type(() => ZoneDto) zone!: ZoneDto;
  @IsOptional() @ValidateNested() @Type(() => MusicianDto) musician?: MusicianDto;
  @IsArray() @ValidateNested({ each: true }) @Type(() => GroupDto) groups!: GroupDto[];
}
