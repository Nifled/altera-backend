import { Expose } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderByDirection } from '../../common/order-by/order-by-direction.enum';
import { OrderByBaseFields } from '../../common/order-by/order-by.interface';

/**
 * @description Defines the properties that can be made sortable for Post and the validations they must satisfy.
 * @example { "createdAt": "DESC", "updatedAt": "ASC" }
 */
export class PostOrderByDto implements OrderByBaseFields {
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
  caption?: OrderByDirection;
}
