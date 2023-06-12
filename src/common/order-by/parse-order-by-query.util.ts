import {
  GetPaginationFuncOptions,
  ParsedOrderByField,
} from '../pagination/pagination.types';
import { validateDto } from '../utils/validate-dto.util';
import { OrderByDirection } from './order-by-direction.enum';

export async function parseOrderByFields(
  orderByQuery: any,
  options: GetPaginationFuncOptions,
): Promise<ParsedOrderByField[]> {
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

    // Validate against the DTO if `options.orderByDto` is provided
    if (options.orderByDto) {
      const orderByDtoProperties = parsedOrderByFields.reduce(
        (a, b) => ({ ...a, ...b }),
        {},
      );

      const entity = await validateDto(
        options.orderByDto,
        orderByDtoProperties,
      );

      // Set the fields only to the ones supported by the DTO
      parsedOrderByFields = Object.keys(entity).map((f) => ({
        [f]: entity[f as keyof typeof entity],
      }));
    }
  }

  return parsedOrderByFields;
}
