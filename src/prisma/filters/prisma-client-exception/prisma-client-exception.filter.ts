import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

// All Prisma Client Error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
type PrismaErrorCodes = {
  P2000: 'P2000'; // “The provided value for the column is too long for the column’s type. Column: {column_name}”
  P2002: 'P2002'; // “Unique constraint failed on the {constraint}”
  P2025: 'P2025'; // “An operation failed because it depends on one or more records that were required but not found. {cause}”
};
type PrismaErrorCodesValue = PrismaErrorCodes[keyof PrismaErrorCodes];

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const prismaErrorCode = exception.code as PrismaErrorCodesValue;
    const message = `[${prismaErrorCode}]: ${this.shortenExceptionMessage(
      exception.message,
    )}`;

    switch (prismaErrorCode) {
      case 'P2000':
        const badRequestCode = HttpStatus.BAD_REQUEST;

        super.catch(
          new HttpException(
            { statusCode: badRequestCode, message },
            badRequestCode,
          ),
          host,
        );
        break;

      case 'P2002':
        const conflictCode = HttpStatus.CONFLICT;

        super.catch(
          new HttpException(
            { statusCode: conflictCode, message },
            conflictCode,
          ),
          host,
        );
        break;

      case 'P2025':
        const notFoundCode = HttpStatus.NOT_FOUND;

        super.catch(
          new HttpException(
            { statusCode: notFoundCode, message },
            notFoundCode,
          ),
          host,
        );

        break;

      default:
        super.catch(exception, host);
    }
  }

  private shortenExceptionMessage(message: string): string {
    const shortMessage = message.substring(message.indexOf('→'));

    return shortMessage
      .substring(shortMessage.indexOf('\n'))
      .replace(/\n/g, '')
      .trim();
  }
}
