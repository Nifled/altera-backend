import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { StorageService } from '../storage/storage.service';
import { PostMediaDto } from './dto/post-media.dto';
import { PostReactionDto } from './dto/post-reaction.dto';

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

  async addReaction(postId: string, postReactionDto: PostReactionDto) {
    const isValidPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!isValidPost) {
      throw new NotFoundException(`Post not found with id: ${postId}.`);
    }

    const postReactionType = await this.prisma.postReactionType.upsert({
      where: { name: postReactionDto.reactionType },
      create: { name: postReactionDto.reactionType },
      update: {},
    });

    const existingPostReaction = await this.prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: postReactionDto.userId,
        },
        typeId: postReactionType.id,
      },
      include: { type: true },
    });

    if (existingPostReaction) {
      return existingPostReaction;
    }

    // If there's already an existing reaction for the user+post, update it. Otherwise,
    // create a new one. This allows for a user to react only once to a single post.
    return this.prisma.postReaction.upsert({
      where: {
        postId_userId: {
          postId,
          userId: postReactionDto.userId,
        },
      },
      // In an `upsert` if we pass in invalid data to a FK (like `postId`), Prisma will not throw an error
      // if the related entity does not exist. So we check if the postId exists (see first check of this method)
      // https://www.prisma.io/docs/concepts/components/prisma-schema/relations/relation-mode#which-foreign-key-constraints-are-emulated
      create: {
        postId,
        userId: postReactionDto.userId,
        typeId: postReactionType.id,
      },
      update: {
        typeId: postReactionType.id,
      },
      include: { type: true },
    });
  }

  async removeReaction(postId: string, postReactionDto: PostReactionDto) {
    const postReactionType = await this.prisma.postReactionType.findUnique({
      where: { name: postReactionDto.reactionType },
    });

    if (!postReactionType) {
      throw new NotFoundException(
        `Post reaction ${postReactionDto.reactionType} type not found.`,
      );
    }

    return this.prisma.postReaction.delete({
      where: {
        postId_userId: {
          postId,
          userId: postReactionDto.userId,
        },
        typeId: postReactionType.id,
      },
    });
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
