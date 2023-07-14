import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { Post } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { ConfigService } from '@nestjs/config';

const POSTS_ARRAY: Partial<Post>[] = [
  { caption: 'This is a cool post #1', authorId: 'denzel' },
  { caption: 'This is an alright post #2', authorId: 'denzel' },
];
const ONE_POST = POSTS_ARRAY[0];

const DB = {
  post: {
    findMany: jest.fn().mockResolvedValue(POSTS_ARRAY),
    findUnique: jest.fn().mockResolvedValue(ONE_POST),
    create: jest.fn().mockResolvedValue(ONE_POST),
    update: jest.fn().mockResolvedValue(ONE_POST),
    delete: jest.fn().mockResolvedValue(ONE_POST),
  },
};

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        ConfigService,
        { provide: PrismaService, useValue: DB },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const createPostDto = ONE_POST as CreatePostDto;

    it('should successfully create a post', async () => {
      const createSpy = jest.spyOn(prisma.post, 'create');
      const createdPost = await service.create(createPostDto);

      expect(createSpy).toBeCalledWith({
        data: createPostDto,
      });
      expect(createdPost).toEqual(ONE_POST);
    });
  });

  describe('findAll()', () => {
    it('should return an array of posts', async () => {
      const posts = await service.findAll({} as PaginationParamsDto);
      expect(posts).toEqual(POSTS_ARRAY);
    });
  });

  describe('findOne()', () => {
    it('should get a single post', async () => {
      const findOneSpy = jest.spyOn(prisma.post, 'findUnique');
      const foundPost = await service.findOne('1');

      expect(findOneSpy).toBeCalledWith({ where: { id: '1' } });
      expect(foundPost).toEqual(ONE_POST);
    });
  });

  describe('update()', () => {
    const updateUserDto: UpdatePostDto = {
      caption: 'Updated post!',
    };

    it('should update a single post', async () => {
      const updateSpy = jest.spyOn(prisma.post, 'update');
      const updatedUser = await service.update('1', updateUserDto);

      expect(updateSpy).toBeCalledWith({
        where: { id: '1' },
        data: updateUserDto,
      });
      expect(updatedUser).toEqual(ONE_POST);
    });
  });

  describe('remove()', () => {
    it('should remove a single post', async () => {
      const removeSpy = jest.spyOn(prisma.post, 'delete');
      const removedUser = await service.remove('1');

      expect(removeSpy).toBeCalledWith({ where: { id: '1' } });
      expect(removedUser).toEqual(ONE_POST);
    });
  });
});
