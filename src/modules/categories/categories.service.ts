import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CategoryResponseDto } from './dtos/category-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    user: User,
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, userId: user.id },
    });

    if (existingCategory) {
      throw new ConflictException(
        'Category with this name already exists for this user',
      );
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId: user.id,
    });

    const savedCategory = await this.categoryRepository.save(category);

    return this.mapCategoryToResponse(savedCategory);
  }

  async findAll(userId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { userId },
      relations: ['tasks'],
    });

    return categories.map((category) => ({
      ...this.mapCategoryToResponse(category),
      taskCount: category.tasks?.length || 0,
    }));
  }

  async findOne(id: string, userId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['tasks', 'tasks.subtasks'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('You do not have access to this category');
    }

    return this.mapCategoryToResponse(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('You do not have access to this category');
    }

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== category.name
    ) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name, userId },
      });

      if (existingCategory) {
        throw new ConflictException(
          'Category with this name already exists for this user',
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    await this.categoryRepository.save(category);

    return this.mapCategoryToResponse(category);
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('You do not have access to this category');
    }

    await this.categoryRepository.remove(category);
  }

  private mapCategoryToResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      tasks: category.tasks
        ? category.tasks.map((task) => ({
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
          }))
        : undefined,
    };
  }
}
