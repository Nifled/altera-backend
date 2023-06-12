import { ExecutionContext, Logger, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { PaginationParamsDto } from './pagination-params.dto';
import { validateDto } from '../utils/validate-dto.util';
import { GetPaginationFuncOptions } from './pagination.types';
import { parseOrderByFields } from '../order-by/parse-order-by-query.util';

/**
 * @description Parses and validates request query Pagination params like `limit`, `cursor` and `orderBy`.
 * @param orderByDto Dto to validate the orderBy fields. Passing in a valid DTO (e.g. `PostOrderByDto`) will validate the fields and filter out any unwanted ones.
 * @returns PaginationParamsDto
 * @example @GetPagination({ orderByDto: PostOrderByDto })
 */
export const GetPagination = createParamDecorator(
  async (options: GetPaginationFuncOptions, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    Logger.log('Incoming request.query', request.query);

    const { orderBy: orderByQuery } = request.query;

    const parsedOrderByFields = await parseOrderByFields(orderByQuery, options);

    const objectToValidate = {
      ...request.query, // might include `limit`, `cursor`, etc
      orderBy: parsedOrderByFields,
    };

    return await validateDto(PaginationParamsDto, objectToValidate);
  },
);
