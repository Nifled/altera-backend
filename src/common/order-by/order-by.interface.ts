import { OrderByDirection } from './order-by-direction.enum';

// Fields that are available to order by on any entity
enum BaseOrderByField {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export interface OrderByBaseFields {
  [BaseOrderByField.createdAt]?: OrderByDirection;
  [BaseOrderByField.updatedAt]?: OrderByDirection;
}
