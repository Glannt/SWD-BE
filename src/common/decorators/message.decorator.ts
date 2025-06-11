import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESS = 'response_message';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESS, message);
