import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { SubtaskResponseDto } from '../../subtasks/dtos/subtask-response.dto';

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ required: false })
  dueDate?: Date;

  @ApiProperty()
  completed: boolean;

  @ApiProperty({ required: false, nullable: true })
  completedAt?: Date | null;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false })
  categoryId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  user?: {
    id: string;
    email: string;
    username: string;
  };

  @ApiProperty({ required: false })
  category?: {
    id: string;
    name: string;
    color?: string;
  };

  @ApiProperty({ type: [SubtaskResponseDto], required: false })
  subtasks?: SubtaskResponseDto[];
}

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[];

  @ApiProperty()
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TaskStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };

  @ApiProperty()
  byStatus: {
    ACTIVE: number;
    COMPLETED: number;
  };

  @ApiProperty()
  dueToday: number;

  @ApiProperty()
  overdue: number;
}
