import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateOpenPositionDto {
  @IsString() instrument!: string;
  @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau!: string;
}

export class UpdateOpenPositionDto {
  @IsOptional() @IsString() instrument?: string;
  @IsOptional() @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau?: string;
}