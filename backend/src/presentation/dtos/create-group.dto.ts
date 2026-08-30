import { IsArray, IsEmail, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateGroupDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  name!: string;

  @IsArray()
  @IsString({ each: true })
  styles!: string[];

  @IsIn(['association', 'professionnel'])
  status!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  audioLinks!: string[];

  @ValidateNested()
  @Type(() => ZoneInputDto)
  zone!: ZoneInputDto;
}