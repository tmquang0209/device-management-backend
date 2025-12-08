import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nContext, i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const i18n = I18nContext.current<I18nTranslations>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let exceptionResponse: any;
    let errorMessage: string | string[];

    if (exception instanceof HttpException) {
      exceptionResponse = exception.getResponse();
      errorMessage = exceptionResponse.message;
    } else {
      const internalErrorMessage = i18nValidationMessage<I18nTranslations>(
        'common.http.internal_error',
        {},
      );
      errorMessage =
        typeof internalErrorMessage === 'function'
          ? (i18n?.translate('common.http.internal_error') as string)
          : internalErrorMessage;
    }

    const errorResponse = {
      status: httpStatus,
      message: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
    };

    console.error(`[${request.method}] ${request.url}`, exception);
    response.status(httpStatus).json(errorResponse);
  }
}
