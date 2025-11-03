import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubtaskDto {
  @ApiProperty({ example: 'Review code changes' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}
