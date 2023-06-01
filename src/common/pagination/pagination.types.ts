import { OrderByDirection } from '../order-by/order-by-direction.enum';

// Example => { 'createdAt': 'DESC' } or { 'firstName': 'ASC' }
export type ParsedOrderByField = { [key: string]: OrderByDirection };
