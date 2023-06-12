import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await this.passwordService.hashPassword(
      createUserDto.password,
    );
    createUserDto.password = hashedPassword;

    return this.prisma.user.create({ data: createUserDto });
  }

  findAll({
    limit,
    cursor,
    orderBy,
    email,
    firstName,
    lastName,
  }: PaginationParamsDto & UsersQueryDto) {
    return this.prisma.user.findMany({
      take: limit,
      // Skip 1 to not include the first item (`next_cursor` req query param)
      // https://www.prisma.io/docs/concepts/components/prisma-client/pagination#do-i-always-have-to-skip-1
      skip: cursor ? 1 : undefined,
      orderBy,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        ...(email ? { email: { contains: email } } : {}),
        ...(firstName ? { firstName: { contains: firstName } } : {}),
        ...(lastName ? { lastName: { contains: lastName } } : {}),
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const updatedHashedPassword = await this.passwordService.hashPassword(
        updateUserDto.password,
      );
      updateUserDto.password = updatedHashedPassword;
    }

    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
