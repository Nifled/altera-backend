import { Expose } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderByDirection } from '../../common/order-by/order-by-direction.enum';
import { OrderByBaseFields } from '../../common/order-by/order-by.interface';

/**
 * @description Defines the properties that can be made sortable for User and the validations they must satisfy.
 * @example { "createdAt": "desc", "updatedAt": "asc" }
 */
export class UsersOrderByDto implements OrderByBaseFields {
  @Expose()
  @IsOptional()
  @IsEnum(OrderByDirection)
  createdAt?: OrderByDirection;

  @Expose()
  @IsOptional()
  @IsEnum(OrderByDirection)
  updatedAt?: OrderByDirection;

  @Expose()
  @IsOptional()
  @IsEnum(OrderByDirection)
  firstName?: OrderByDirection;

  @Expose()
  @IsOptional()
  @IsEnum(OrderByDirection)
  lastName?: OrderByDirection;

  @Expose()
  @IsOptional()
  @IsEnum(OrderByDirection)
  email?: OrderByDirection;
}
