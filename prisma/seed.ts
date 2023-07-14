import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import { Logger } from '@nestjs/common';
const prisma = new PrismaClient();

const AMOUNT_USERS = 25;
const AMOUNT_POSTS_PER_USER = 5;

async function main() {
  try {
    await createUsers();
    Logger.log('[SEED] Successfully created user records');
  } catch {
    Logger.error('[SEED] Failed to create user records');
  }

  try {
    await createPosts();
    Logger.log('[SEED] Successfully created post records');
  } catch {
    Logger.error('[SEED] Failed to create post records');
  }
}

async function createUsers(amount = AMOUNT_USERS) {
  const userDtos: CreateUserDto[] = [];

  for (let i = 0; i < amount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    userDtos.push({
      email: faker.internet.email({ firstName, lastName }),
      password: faker.internet.password(),
      firstName,
      lastName,
    });
  }

  await prisma.user.createMany({
    data: userDtos,
  });
}

async function createPosts(
  amountOfUsers = AMOUNT_USERS,
  amountOfPostsPerUser = AMOUNT_POSTS_PER_USER,
) {
  await createUsers(amountOfUsers);

  const users = await prisma.user.findMany({
    take: amountOfUsers,
  });

  const postDtos: CreatePostDto[] = [];
  users.forEach((user) => {
    for (let i = 0; i < amountOfPostsPerUser; i++) {
      postDtos.push({
        caption: faker.lorem.paragraph(),
        authorId: user.id,
      });
    }
  });

  await prisma.post.createMany({
    data: postDtos,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
