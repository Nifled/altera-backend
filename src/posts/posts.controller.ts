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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PostEntity } from './entities/post.entity';
import { PayloadExistsPipe } from '../common/pipes/payload-exists.pipe';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { GetPagination } from '../common/pagination/get-pagination.decorator';
import { PostsOrderByDto } from './dto/posts-order-by.dto';
import { PaginationMetaEntity } from '../common/pagination/entities/pagination-meta.entity';
import { PaginationPageEntity } from '../common/pagination/entities/pagination-page.entity';
import { ApiOkResponsePaginated } from '../common/pagination/api-ok-response-paginated.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ImageFilesValidatorPipe } from '../storage/pipes/image-file-validator.pipe';
import { PostReactionDto } from './dto/post-reaction.dto';
import { PostReactionEntity } from './entities/post-reaction.entity';

@Controller({ path: 'posts', version: '1' })
@ApiTags('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiCreatedResponse({ type: PostEntity })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @UploadedFiles(new ImageFilesValidatorPipe()) files: Express.Multer.File[],
    @Body(new PayloadExistsPipe()) createPostDto: CreatePostDto,
  ) {
    createPostDto.files = files;
    const post = await this.postsService.create(createPostDto);
    return new PostEntity(post);
  }

  @Get()
  @ApiQuery({ type: PaginationParamsDto, required: false })
  @ApiOkResponsePaginated(PostEntity)
  async findAll(
    @GetPagination({ orderByDto: PostsOrderByDto })
    { limit, orderBy, cursor }: PaginationParamsDto,
  ) {
    const posts = await this.postsService.findAll({
      limit,
      cursor,
      orderBy,
    });

    const paginationMeta = new PaginationMetaEntity({
      nextCursor: posts[posts.length - 1].id || null,
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

    return new PostEntity(post);
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

  @Post(':id/reactions')
  @ApiOkResponse({ type: PostEntity })
  async addReaction(
    @Param('id') id: string,
    @Body() postReactionDto: PostReactionDto,
  ) {
    const postReaction = await this.postsService.addReaction(
      id,
      postReactionDto,
    );

    return new PostReactionEntity(postReaction);
  }

  @Delete(':id/reactions')
  @ApiOkResponse({ type: PostEntity })
  async removeReaction(
    @Param('id') id: string,
    @Body() postReactionDto: PostReactionDto,
  ) {
    await this.postsService.removeReaction(id, postReactionDto);
  }

  @Post(':id/upload-file')
  @ApiCreatedResponse({ type: PostEntity })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async addMediaToPost(
    @Param('id') id: string,
    @UploadedFiles(new ImageFilesValidatorPipe()) files: Express.Multer.File[],
  ) {
    const post = await this.postsService.addMediaToPost(id, files);

    return new PostEntity(post);
  }
}
