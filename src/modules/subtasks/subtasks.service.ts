import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subtask } from './entities/subtask.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateSubtaskDto } from './dtos/create-subtask.dto';
import { UpdateSubtaskDto } from './dtos/update-subtask.dto';
import { SubtaskResponseDto } from './dtos/subtask-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectRepository(Subtask)
    private subtaskRepository: Repository<Subtask>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(
    createSubtaskDto: CreateSubtaskDto,
    userId: string,
  ): Promise<SubtaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: createSubtaskDto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    const subtask = this.subtaskRepository.create({
      title: createSubtaskDto.title,
      taskId: createSubtaskDto.taskId,
    });

    const savedSubtask = await this.subtaskRepository.save(subtask);

    return this.mapSubtaskToResponse(savedSubtask);
  }

  async update(
    id: string,
    updateSubtaskDto: UpdateSubtaskDto,
    userId: string,
  ): Promise<SubtaskResponseDto> {
    const subtask = await this.subtaskRepository.findOne({
      where: { id },
      relations: ['task'],
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    if (subtask.task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this subtask');
    }

    Object.assign(subtask, updateSubtaskDto);
    await this.subtaskRepository.save(subtask);

    return this.mapSubtaskToResponse(subtask);
  }

  async remove(id: string, userId: string): Promise<void> {
    const subtask = await this.subtaskRepository.findOne({
      where: { id },
      relations: ['task'],
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    if (subtask.task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this subtask');
    }

    await this.subtaskRepository.remove(subtask);
  }

  async toggleComplete(id: string, userId: string): Promise<SubtaskResponseDto> {
    const subtask = await this.subtaskRepository.findOne({
      where: { id },
      relations: ['task'],
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    if (subtask.task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this subtask');
    }

    subtask.completed = !subtask.completed;
    await this.subtaskRepository.save(subtask);

    return this.mapSubtaskToResponse(subtask);
  }

  private mapSubtaskToResponse(subtask: Subtask): SubtaskResponseDto {
    return {
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completed,
      taskId: subtask.taskId,
      createdAt: subtask.createdAt,
      updatedAt: subtask.updatedAt,
    };
  }
}
