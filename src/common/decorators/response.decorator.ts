import { RESPONSE_MSG_KEY } from '@common/enums';
import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';

export type ResponseMessageType =
  | string
  | ((ctx?: ExecutionContext) => string)
  | ((a: ValidationArguments) => string)
  | (() => string);

export const ResponseMessage = (message: ResponseMessageType) => {
  return SetMetadata(RESPONSE_MSG_KEY, message);
};
