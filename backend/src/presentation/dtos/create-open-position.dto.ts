import { IsIn, IsString } from 'class-validator';

export class CreateOpenPositionDto {
  @IsString() instrument!: string;
  @IsIn(['debutant', 'intermediaire', 'avance', 'expert']) niveau!: string;
}