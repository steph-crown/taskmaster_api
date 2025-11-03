import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubtaskDto {
  @ApiProperty({ example: 'Review code changes', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
