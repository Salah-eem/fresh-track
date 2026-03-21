import { IsNotEmpty, IsString } from 'class-validator';

export class ExtractDateDto {
  @IsString()
  @IsNotEmpty()
  base64Image: string;
}
