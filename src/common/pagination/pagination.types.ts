import { ClassConstructor } from 'class-transformer';
import { OrderByDirection } from '../order-by/order-by-direction.enum';

// Example => { 'createdAt': 'DESC' } or { 'firstName': 'ASC' }
export type ParsedOrderByField = { [key: string]: OrderByDirection };

export type GetPaginationFuncOptions = {
  orderByDto?: ClassConstructor<any>;
};
