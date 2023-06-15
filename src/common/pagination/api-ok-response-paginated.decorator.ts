import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationPageEntity } from './entities/pagination-page.entity';

/**
 *
 * @param entity
 * This is used to generate a pagination page definition for Swagger (based on `PaginationPageEntity`)
 */
export const ApiOkResponsePaginated = <DataEntity extends Type<unknown>>(
  entity: DataEntity,
) =>
  applyDecorators(
    ApiExtraModels(PaginationPageEntity, entity),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(entity) },
              },
            },
          },
          { $ref: getSchemaPath(PaginationPageEntity) },
        ],
      },
    }),
  );
