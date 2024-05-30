import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from '@prisma/client';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { PostReactionDto } from './dto/post-reaction.dto';

const POSTS_ARRAY: Partial<Post>[] = [
  { id: '1', caption: 'This is a cool post #1', authorId: 'denzel' },
  { id: '2', caption: 'This is a post #2', authorId: 'denzel' },
];
const ONE_POST = POSTS_ARRAY[0];

const ONE_POST_REACTION = {
  id: '1',
  postId: '1',
  userId: '1',
  typeId: '1',
};

const SERVICE = {
  findAll: jest.fn().mockResolvedValue(POSTS_ARRAY),
  findOne: jest.fn().mockResolvedValue(ONE_POST),
  create: jest.fn().mockResolvedValue(ONE_POST),
  update: jest.fn().mockResolvedValue(ONE_POST),
  remove: jest.fn().mockResolvedValue(ONE_POST),
  addReaction: jest.fn().mockResolvedValue(ONE_POST_REACTION),
  removeReaction: jest.fn(),
};

const POST_FILES = [
  {
    mimetype: 'image/jpeg',
    buffer: Buffer.from('This is a test file'),
  },
  {
    mimetype: 'image/png',
    buffer: Buffer.from('This is a test file'),
  },
] as Express.Multer.File[];

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [PostsService, { provide: PostsService, useValue: SERVICE }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /posts create()', () => {
    const createPostDto = {
      caption: 'This is a cool post',
      authorId: 'some author id',
    };

    it('should successfully create a post', async () => {
      const createdSpy = jest.spyOn(service, 'create');
      const createdPost = await controller.create(POST_FILES, createPostDto);

      expect(createdSpy).toBeCalledTimes(1);
      expect(createdPost).toEqual(ONE_POST);
    });
  });

  describe('GET /posts findAll()', () => {
    it('should return an array of posts', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const posts = await controller.findAll({} as PaginationParamsDto);

      expect(findAllSpy).toBeCalledTimes(1);
      expect(posts.data).toEqual(POSTS_ARRAY);
    });
  });

  describe('GET /posts findOne()', () => {
    it('should return a post', async () => {
      const findOneSpy = jest.spyOn(service, 'findOne');
      const post = await controller.findOne('1');

      expect(findOneSpy).toBeCalledWith('1');
      expect(post).toEqual(ONE_POST);
    });
  });

  describe('PATCH /posts update()', () => {
    const udpatePostDto = new UpdatePostDto();

    it('should return the updated post', async () => {
      const updateSpy = jest.spyOn(service, 'update');
      const post = await controller.update('1', udpatePostDto);

      expect(updateSpy).toBeCalledWith('1', udpatePostDto);
      expect(post).toEqual(ONE_POST);
    });
  });

  describe('DELETE /posts remove()', () => {
    it('should return the removed post', async () => {
      const removeSpy = jest.spyOn(service, 'remove');
      const post = await controller.remove('1');

      expect(removeSpy).toBeCalledWith('1');
      expect(post).toEqual(ONE_POST);
    });
  });

  describe('POST /posts/:id/reactions addReaction()', () => {
    const postReactionDto: PostReactionDto = {
      userId: 'some user id',
      reactionType: 'like',
    };

    it('should successfully add a reaction to a post', async () => {
      const spy = jest.spyOn(service, 'addReaction');
      const updatedPost = await controller.addReaction(
        'post1',
        postReactionDto,
      );

      expect(spy).toBeCalledTimes(1);
      expect(updatedPost).toEqual(ONE_POST_REACTION);
    });
  });

  describe('DELETE /posts/:id/reactions removeReaction()', () => {
    const postReactionDto: PostReactionDto = {
      userId: 'some user id',
      reactionType: 'like',
    };

    it('should successfully add a reaction to a post', async () => {
      const spy = jest.spyOn(service, 'removeReaction');
      await controller.removeReaction('post1', postReactionDto);

      expect(spy).toBeCalledTimes(1);
    });
  });
});
