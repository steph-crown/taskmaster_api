import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dtos/create-subtask.dto';
import { UpdateSubtaskDto } from './dtos/update-subtask.dto';
import { SubtaskResponseDto } from './dtos/subtask-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('subtasks')
@Controller('subtasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subtask' })
  @ApiBody({ type: CreateSubtaskDto })
  @ApiResponse({
    status: 201,
    description: 'Subtask created successfully',
    type: SubtaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async create(
    @Body() createSubtaskDto: CreateSubtaskDto,
    @GetUser() user: User,
  ): Promise<SubtaskResponseDto> {
    return this.subtasksService.create(createSubtaskDto, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a subtask' })
  @ApiParam({ name: 'id', description: 'Subtask ID' })
  @ApiBody({ type: UpdateSubtaskDto })
  @ApiResponse({
    status: 200,
    description: 'Subtask updated successfully',
    type: SubtaskResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Subtask not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
    @GetUser() user: User,
  ): Promise<SubtaskResponseDto> {
    return this.subtasksService.update(id, updateSubtaskDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subtask' })
  @ApiParam({ name: 'id', description: 'Subtask ID' })
  @ApiResponse({ status: 204, description: 'Subtask deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Subtask not found' })
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.subtasksService.remove(id, user.id);
  }

  @Post(':id/toggle-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle subtask completion status' })
  @ApiParam({ name: 'id', description: 'Subtask ID' })
  @ApiResponse({
    status: 200,
    description: 'Subtask completion status toggled successfully',
    type: SubtaskResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Subtask not found' })
  async toggleComplete(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<SubtaskResponseDto> {
    return this.subtasksService.toggleComplete(id, user.id);
  }
}
