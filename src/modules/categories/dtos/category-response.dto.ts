import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from '../../tasks/dtos/task-response.dto';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  color?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [TaskResponseDto], required: false })
  tasks?: TaskResponseDto[];

  @ApiProperty({ required: false })
  taskCount?: number;
}
