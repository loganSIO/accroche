import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class MusicianProfileZoneDto {
  @IsNumber() latitude!: number;
  @IsNumber() longitude!: number;
  @IsNumber() rayonKm!: number;
  @IsString() ville!: string;
}

export class MusicianProfileInstrumentDto {
  @IsString() instrument!: string;
  @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau!: 'debutant' | 'intermediaire' | 'avance' | 'expert';
}

export class MusicianProfileAvailabilityDto {
  @IsString() jourSemaine!: string;
  @IsIn(['matin', 'apres-midi', 'soir']) creneauxJournee!: 'matin' | 'apres-midi' | 'soir';
}

export class CreateMusicianProfileDto {
  @IsString() musicianName!: string;
  @IsIn(['amateur', 'pro']) status!: 'amateur' | 'pro';
  @IsArray() @ValidateNested({ each: true }) @Type(() => MusicianProfileInstrumentDto)
  instruments!: MusicianProfileInstrumentDto[];
  @IsArray() @IsString({ each: true }) styles!: string[];
  @IsArray()   @IsIn(['join_group', 'found_group'], { each: true }) objective!: ('join_group' | 'found_group')[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => MusicianProfileAvailabilityDto)
  availabilities!: MusicianProfileAvailabilityDto[];
  @IsOptional() @IsString() bio?: string;
  @ValidateNested() @Type(() => MusicianProfileZoneDto) zone!: MusicianProfileZoneDto;
}

export class UpdateMusicianProfileDto {
  @IsOptional() @IsString() musicianName?: string;
  @IsOptional()   @IsIn(['amateur', 'pro']) status?: 'amateur' | 'pro';
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MusicianProfileInstrumentDto)
  instruments?: MusicianProfileInstrumentDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) styles?: string[];
  @IsOptional() @IsArray()   @IsIn(['join_group', 'found_group'], { each: true }) objective?: ('join_group' | 'found_group')[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MusicianProfileAvailabilityDto)
  availabilities?: MusicianProfileAvailabilityDto[];
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @ValidateNested() @Type(() => MusicianProfileZoneDto) zone?: MusicianProfileZoneDto;
}
