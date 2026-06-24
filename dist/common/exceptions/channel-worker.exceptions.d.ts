import { HttpException } from '@nestjs/common';
export declare class ChannelNotSupportedException extends HttpException {
    constructor(channel: string);
}
export declare class EmailSendException extends HttpException {
    constructor(destination: string, error?: string);
}
export declare class SmsSendException extends HttpException {
    constructor(destination: string, error?: string);
}
export declare class WhatsappSendException extends HttpException {
    constructor(destination: string, error?: string);
}
export declare class MaxRetriesExceededException extends HttpException {
    constructor(notificationId: string);
}
