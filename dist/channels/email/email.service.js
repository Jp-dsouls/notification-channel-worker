"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const channel_worker_exceptions_1 = require("../../common/exceptions/channel-worker.exceptions");
let EmailService = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: Number(this.configService.get('SMTP_PORT')),
            secure: this.configService.get('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }
    async send(message) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'EmailService.send',
            correlationId: message.correlationId,
            notificationId: message.notificationId,
            destination: message.destination,
            message: 'Sending email',
        }));
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_USER'),
                to: message.destination,
                subject: 'Notification',
                text: message.content,
                html: `<p>${message.content}</p>`,
            });
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'EmailService.send',
                correlationId: message.correlationId,
                notificationId: message.notificationId,
                destination: message.destination,
                message: 'Email sent successfully',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'EmailService.send',
                correlationId: message.correlationId,
                notificationId: message.notificationId,
                destination: message.destination,
                message: 'Failed to send email',
                error: error.message,
            }));
            throw new channel_worker_exceptions_1.EmailSendException(message.destination, error.message);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map