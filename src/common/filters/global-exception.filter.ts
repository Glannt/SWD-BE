import { ConfigService } from '@/config/config.service';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import 'dotenv/config';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(
    exception: unknown,
    host: ArgumentsHost,
    // configService: ConfigService,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details = '';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse();

      if (typeof responseData === 'object' && responseData !== null) {
        message = (responseData as any).message || exception.message;
        details = (responseData as any).error || '';
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack || '';
    }

    // Log error for debugging
    console.error(
      `❌ [${new Date().toISOString()}] ${request.method} ${request.url}`,
      {
        status,
        message,
        details:
          process.env.NODE_ENV === 'development'
            ? details
            : 'Hidden in production',
        body: request.body,
        query: request.query,
      },
    );

    // Return user-friendly error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { details }),
    };

    // For chatbot endpoint, return chat-friendly error
    if (request.url.includes('/ask')) {
      response.status(status).json({
        answer: `❌ Xin lỗi, đã xảy ra lỗi kỹ thuật. Vui lòng thử lại sau. ${status === 400 ? '(Định dạng câu hỏi không hợp lệ)' : ''}`,
      });
    } else {
      response.status(status).json(errorResponse);
    }
  }
}
