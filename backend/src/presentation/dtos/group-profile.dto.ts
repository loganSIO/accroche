import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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
}

export class UpdateGroupProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) styles?: string[];
  @IsOptional() @IsIn(['association', 'professionnel']) status?: 'association' | 'professionnel';
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) audioLinks?: string[];
  @IsOptional() @ValidateNested() @Type(() => GroupProfileZoneDto) zone?: GroupProfileZoneDto;
}
