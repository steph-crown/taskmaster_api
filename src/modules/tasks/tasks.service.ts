import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { TaskFilterDto } from './dtos/task-filter.dto';
import {
  TaskResponseDto,
  PaginatedTasksResponseDto,
  TaskStatsResponseDto,
} from './dtos/task-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    user: User,
  ): Promise<TaskResponseDto> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      userId: user.id,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
    });

    const savedTask = await this.taskRepository.save(task);

    return this.findOne(savedTask.id, user.id);
  }

  async findAll(
    filterDto: TaskFilterDto,
    userId: string,
  ): Promise<PaginatedTasksResponseDto> {
    const {
      status,
      priority,
      categoryId,
      sortBy = 'createdAt',
      order = 'DESC',
      search,
      page = 1,
      limit = 10,
    } = filterDto;

    const queryBuilder: SelectQueryBuilder<Task> =
      this.taskRepository.createQueryBuilder('task');

    queryBuilder.where('task.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (categoryId) {
      queryBuilder.andWhere('task.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const validSortFields = ['dueDate', 'createdAt', 'priority'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    if (sortField === 'priority') {
      const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
      queryBuilder.addOrderBy(
        `CASE task.priority WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 END`,
        order,
      );
    } else {
      queryBuilder.orderBy(`task.${sortField}`, order);
    }

    queryBuilder.leftJoinAndSelect('task.category', 'category');
    queryBuilder.leftJoinAndSelect('task.subtasks', 'subtasks');
    queryBuilder.leftJoinAndSelect('task.user', 'user');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks.map((task) => this.mapTaskToResponse(task)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['category', 'subtasks', 'user'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return this.mapTaskToResponse(task);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    const updateData: any = { ...updateTaskDto };

    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    if (
      updateTaskDto.status === TaskStatus.COMPLETED ||
      updateTaskDto.completed === true
    ) {
      updateData.status = TaskStatus.COMPLETED;
      updateData.completed = true;
      updateData.completedAt = new Date();
    } else if (
      updateTaskDto.status === TaskStatus.ACTIVE ||
      updateTaskDto.completed === false
    ) {
      updateData.status = TaskStatus.ACTIVE;
      updateData.completed = false;
      updateData.completedAt = null;
    }

    Object.assign(task, updateData);
    await this.taskRepository.save(task);

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    await this.taskRepository.remove(task);
  }

  async toggleComplete(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    task.completed = !task.completed;
    task.status = task.completed ? TaskStatus.COMPLETED : TaskStatus.ACTIVE;
    task.completedAt = task.completed ? new Date() : null;

    await this.taskRepository.save(task);

    return this.findOne(id, userId);
  }

  async getStats(userId: string): Promise<TaskStatsResponseDto> {
    const [
      total,
      active,
      completed,
      lowPriority,
      mediumPriority,
      highPriority,
      activeStatus,
      completedStatus,
    ] = await Promise.all([
      this.taskRepository.count({ where: { userId } }),
      this.taskRepository.count({
        where: { userId, completed: false },
      }),
      this.taskRepository.count({
        where: { userId, completed: true },
      }),
      this.taskRepository.count({
        where: { userId, priority: TaskPriority.LOW },
      }),
      this.taskRepository.count({
        where: { userId, priority: TaskPriority.MEDIUM },
      }),
      this.taskRepository.count({
        where: { userId, priority: TaskPriority.HIGH },
      }),
      this.taskRepository.count({
        where: { userId, status: TaskStatus.ACTIVE },
      }),
      this.taskRepository.count({
        where: { userId, status: TaskStatus.COMPLETED },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [dueToday, overdue] = await Promise.all([
      this.taskRepository
        .createQueryBuilder('task')
        .where('task.userId = :userId', { userId })
        .andWhere('task.dueDate >= :today', { today })
        .andWhere('task.dueDate < :tomorrow', { tomorrow })
        .andWhere('task.completed = :completed', { completed: false })
        .getCount(),
      this.taskRepository
        .createQueryBuilder('task')
        .where('task.userId = :userId', { userId })
        .andWhere('task.dueDate < :today', { today })
        .andWhere('task.completed = :completed', { completed: false })
        .getCount(),
    ]);

    return {
      total,
      active,
      completed,
      byPriority: {
        low: lowPriority,
        medium: mediumPriority,
        high: highPriority,
      },
      byStatus: {
        ACTIVE: activeStatus,
        COMPLETED: completedStatus,
      },
      dueToday,
      overdue,
    };
  }

  private mapTaskToResponse(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      completed: task.completed,
      completedAt: task.completedAt ?? undefined,
      userId: task.userId,
      categoryId: task.categoryId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      category: task.category
        ? {
            id: task.category.id,
            name: task.category.name,
            color: task.category.color,
          }
        : undefined,
      user: task.user
        ? {
            id: task.user.id,
            email: task.user.email,
            username: task.user.username,
          }
        : undefined,
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => ({
            id: subtask.id,
            title: subtask.title,
            completed: subtask.completed,
            taskId: subtask.taskId,
            createdAt: subtask.createdAt,
            updatedAt: subtask.updatedAt,
          }))
        : undefined,
    };
  }
}
