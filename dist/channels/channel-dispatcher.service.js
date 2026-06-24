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
exports.ChannelDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email/email.service");
const sms_service_1 = require("./sms/sms.service");
const whatsapp_service_1 = require("./whatsapp/whatsapp.service");
const channel_worker_exceptions_1 = require("../common/exceptions/channel-worker.exceptions");
let ChannelDispatcherService = class ChannelDispatcherService {
    constructor(emailService, smsService, whatsappService) {
        this.emailService = emailService;
        this.smsService = smsService;
        this.whatsappService = whatsappService;
    }
    async dispatch(message) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'ChannelDispatcherService.dispatch',
            correlationId: message.correlationId,
            notificationId: message.notificationId,
            channel: message.channel,
            message: 'Dispatching notification to channel',
        }));
        switch (message.channel.toLowerCase()) {
            case 'email':
                await this.emailService.send(message);
                break;
            case 'sms':
                await this.smsService.send(message);
                break;
            case 'whatsapp':
                await this.whatsappService.send(message);
                break;
            default:
                throw new channel_worker_exceptions_1.ChannelNotSupportedException(message.channel);
        }
    }
};
exports.ChannelDispatcherService = ChannelDispatcherService;
exports.ChannelDispatcherService = ChannelDispatcherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        sms_service_1.SmsService,
        whatsapp_service_1.WhatsappService])
], ChannelDispatcherService);
//# sourceMappingURL=channel-dispatcher.service.js.map