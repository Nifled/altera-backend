import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { StorageService } from '../storage/storage.service';
import { PostMediaDto } from './dto/post-media.dto';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const { files, ...createPostData } = createPostDto;

    if (!files || files.length === 0) {
      return this.prisma.post.create({
        data: createPostDto,
      });
    }

    // Upload files
    const mediaUrls = await this.storageService.uploadFiles(files, `posts/`);
    const postMediaDtos = mediaUrls.map((url) => new PostMediaDto({ url }));

    return this.prisma.post.create({
      data: {
        ...createPostData,
        media: {
          createMany: {
            data: postMediaDtos,
          },
        },
      },
      include: { media: true },
    });
  }

  async findAll({ limit, cursor, orderBy }: PaginationParamsDto) {
    return this.prisma.post.findMany({
      take: limit,
      // Skip 1 to not include the first item (`next_cursor` req query param)
      // https://www.prisma.io/docs/concepts/components/prisma-client/pagination#do-i-always-have-to-skip-1
      skip: cursor ? 1 : undefined,
      orderBy,
      cursor: cursor ? { id: cursor } : undefined,
      include: { media: true },
    });
  }

  findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { media: true },
    });
  }

  update(id: string, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async addMediaToPost(postId: string, files: Express.Multer.File[]) {
    const mediaUrls = await this.storageService.uploadFiles(
      files,
      `posts/${postId}/`,
    );

    const postMediaDtos = mediaUrls.map((url) => new PostMediaDto({ url }));

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        media: {
          createMany: {
            data: postMediaDtos,
          },
        },
      },
      include: { media: true },
    });
  }
}
