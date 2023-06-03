import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PostEntity } from './entities/post.entity';
import { PayloadExistsPipe } from '../common/pipes/payload-exists.pipe';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { GetPagination } from '../common/pagination/get-pagination.decorator';
import { PostOrderByDto } from './dto/post-order-by.dto';
import { PaginationMetaEntity } from '../common/pagination/entities/pagination-meta.entity';
import { PaginationPageEntity } from '../common/pagination/entities/pagination-page.entity';

@Controller('posts')
@ApiTags('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiCreatedResponse({ type: PostEntity })
  @UsePipes(new PayloadExistsPipe())
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  @ApiQuery({ type: PaginationParamsDto, required: false })
  @ApiOkResponse({ type: PostEntity, isArray: true })
  async findAll(
    @GetPagination({ orderByDto: PostOrderByDto })
    { limit, orderBy, cursor }: PaginationParamsDto,
  ) {
    const posts = await this.postsService.findAll({
      limit,
      cursor,
      orderBy,
    });

    const paginationMeta = new PaginationMetaEntity({
      nextCursor: posts[posts.length - 1].id,
    });
    const paginatedResponse = new PaginationPageEntity<PostEntity>({
      data: posts.map((p) => new PostEntity(p)),
      meta: paginationMeta,
    });

    return paginatedResponse;
  }

  @Get(':id')
  @ApiOkResponse({ type: PostEntity })
  async findOne(@Param('id') id: string) {
    const post = await this.postsService.findOne(id);

    if (!post) {
      throw new NotFoundException(`Post not found with id: ${id}.`);
    }

    return post;
  }

  @Patch(':id')
  @ApiOkResponse({ type: PostEntity })
  @UsePipes(new PayloadExistsPipe())
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: PostEntity })
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
