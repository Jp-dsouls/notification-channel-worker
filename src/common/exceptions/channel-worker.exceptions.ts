import { HttpException, HttpStatus } from '@nestjs/common';

export class ChannelNotSupportedException extends HttpException {
  constructor(channel: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: `Channel "${channel}" is not supported`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EmailSendException extends HttpException {
  constructor(destination: string, error?: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: `Failed to send email to "${destination}"${error ? `: ${error}` : ''}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class SmsSendException extends HttpException {
  constructor(destination: string, error?: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: `Failed to send SMS to "${destination}"${error ? `: ${error}` : ''}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class WhatsappSendException extends HttpException {
  constructor(destination: string, error?: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: `Failed to send WhatsApp message to "${destination}"${error ? `: ${error}` : ''}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class MaxRetriesExceededException extends HttpException {
  constructor(notificationId: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: `Max retries exceeded for notification "${notificationId}"`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
