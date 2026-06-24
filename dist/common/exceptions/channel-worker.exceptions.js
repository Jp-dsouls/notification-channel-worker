"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxRetriesExceededException = exports.WhatsappSendException = exports.SmsSendException = exports.EmailSendException = exports.ChannelNotSupportedException = void 0;
const common_1 = require("@nestjs/common");
class ChannelNotSupportedException extends common_1.HttpException {
    constructor(channel) {
        super({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: `Channel "${channel}" is not supported`,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.ChannelNotSupportedException = ChannelNotSupportedException;
class EmailSendException extends common_1.HttpException {
    constructor(destination, error) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `Failed to send email to "${destination}"${error ? `: ${error}` : ''}`,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.EmailSendException = EmailSendException;
class SmsSendException extends common_1.HttpException {
    constructor(destination, error) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `Failed to send SMS to "${destination}"${error ? `: ${error}` : ''}`,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.SmsSendException = SmsSendException;
class WhatsappSendException extends common_1.HttpException {
    constructor(destination, error) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `Failed to send WhatsApp message to "${destination}"${error ? `: ${error}` : ''}`,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.WhatsappSendException = WhatsappSendException;
class MaxRetriesExceededException extends common_1.HttpException {
    constructor(notificationId) {
        super({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `Max retries exceeded for notification "${notificationId}"`,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.MaxRetriesExceededException = MaxRetriesExceededException;
//# sourceMappingURL=channel-worker.exceptions.js.map