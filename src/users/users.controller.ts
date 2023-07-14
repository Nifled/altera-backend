import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  UsePipes,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PayloadExistsPipe } from '../common/pipes/payload-exists.pipe';
import { GetPagination } from '../common/pagination/get-pagination.decorator';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersOrderByDto } from './dto/users-order-by.dto';
import { PaginationMetaEntity } from '../common/pagination/entities/pagination-meta.entity';
import { PaginationPageEntity } from '../common/pagination/entities/pagination-page.entity';
import { ApiOkResponsePaginated } from '../common/pagination/api-ok-response-paginated.decorator';

@Controller({ path: 'users', version: '1' })
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({ type: UserEntity })
  @UsePipes(new PayloadExistsPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    return new UserEntity(await this.usersService.create(createUserDto));
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ type: PaginationParamsDto, required: false })
  @ApiOkResponsePaginated(UserEntity)
  async findAll(
    @GetPagination({ orderByDto: UsersOrderByDto })
    { limit, cursor, orderBy }: PaginationParamsDto,
    @Query() query: UsersQueryDto,
  ) {
    const users = await this.usersService.findAll({
      limit,
      cursor,
      orderBy,
      ...query,
    });

    const paginationMeta = new PaginationMetaEntity({
      nextCursor: users[users.length - 1].id || null,
    });
    const paginatedResponse = new PaginationPageEntity<UserEntity>({
      data: users.map((user) => new UserEntity(user)),
      meta: paginationMeta,
    });

    return paginatedResponse;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}.`);
    }

    return new UserEntity(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: UserEntity })
  @UsePipes(new PayloadExistsPipe())
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return new UserEntity(await this.usersService.update(id, updateUserDto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async remove(@Param('id') id: string) {
    return new UserEntity(await this.usersService.remove(id));
  }
}
