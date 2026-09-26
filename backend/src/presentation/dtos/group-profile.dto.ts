import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RequestedInstrumentDto {
  @IsString() instrument!: string;
  @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau!: string;
}

export class GroupProfileZoneDto {
  @IsNumber() latitude!: number;
  @IsNumber() longitude!: number;
  @IsNumber() rayonKm!: number;
  @IsString() ville!: string;
}

export class CreateGroupProfileDto {
  @IsString() name!: string;
  @IsArray() @IsString({ each: true }) styles!: string[];
  @IsIn(['association', 'professionnel']) status!: 'association' | 'professionnel';
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsString({ each: true }) audioLinks!: string[];
  @ValidateNested() @Type(() => GroupProfileZoneDto) zone!: GroupProfileZoneDto;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestedInstrumentDto)
  requestedInstruments!: RequestedInstrumentDto[];
}

export class UpdateGroupProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) styles?: string[];
  @IsOptional() @IsIn(['association', 'professionnel']) status?: 'association' | 'professionnel';
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) audioLinks?: string[];
  @IsOptional() @ValidateNested() @Type(() => GroupProfileZoneDto) zone?: GroupProfileZoneDto;
}
