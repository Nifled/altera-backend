import { ExecutionContext, Logger, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { OrderByDirection } from '../order-by/order-by-direction.enum';
import { PaginationParamsDto } from './pagination-params.dto';
import { ClassConstructor } from 'class-transformer';
import { validateDto } from '../utils/validate-dto.util';
import { ParsedOrderByField } from './pagination.types';

type GetPaginationFuncParams = {
  orderByDto?: ClassConstructor<any>;
};

/**
 * @description Parses and validates request query Pagination params like `limit`, `cursor` and `orderBy`.
 * @param orderByDto Dto to validate the orderBy fields. Passing in a valid DTO (e.g. `PostOrderByDto`) will validate the fields and filter out any unwanted ones.
 * @returns PaginationParamsDto
 * @example @GetPagination({ orderByDto: PostOrderByDto })
 */
export const GetPagination = createParamDecorator(
  async ({ orderByDto }: GetPaginationFuncParams, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    Logger.log('Incoming request.query', request.query);

    const { orderBy: orderByQuery } = request.query;
    let parsedOrderByFields: ParsedOrderByField[] = [];

    // `orderBy` can be set multiple times on the same request. Merge any multiple orderBy fields
    const orderBy = Array.isArray(orderByQuery)
      ? orderByQuery.join(',')
      : orderByQuery;
    if (typeof orderBy === 'string' && orderBy.length) {
      const dirtyFields = orderBy.split(','); // '-createdAt', 'firstName'

      parsedOrderByFields = dirtyFields.map((field) => {
        const isDirectionDesc = field.includes('-');
        const cleanField = field.replace('-', '');

        return {
          [cleanField]: isDirectionDesc
            ? OrderByDirection.DESC
            : OrderByDirection.ASC,
        };
      });

      // if a `orderByDto` is provided, use it to validate the orderBy fields
      if (orderByDto) {
        const orderByDtoProperties = parsedOrderByFields.reduce(
          (a, b) => ({ ...a, ...b }),
          {},
        );

        const entity = await validateDto(orderByDto, orderByDtoProperties);
        parsedOrderByFields = Object.keys(entity).map((f) => ({
          [f]: entity[f as keyof typeof entity],
        }));
      }
    }

    const objectToValidate = {
      ...request.query, // might include `limit`, `cursor`, etc
      orderBy: parsedOrderByFields,
    };

    return await validateDto(PaginationParamsDto, objectToValidate);
  },
);
