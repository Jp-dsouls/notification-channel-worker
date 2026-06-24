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
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const channel_worker_exceptions_1 = require("../../common/exceptions/channel-worker.exceptions");
let SmsService = class SmsService {
    constructor(configService) {
        this.configService = configService;
    }
    async send(message) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'SmsService.send',
            correlationId: message.correlationId,
            notificationId: message.notificationId,
            destination: message.destination,
            message: 'Sending SMS',
        }));
        try {
            const accountSid = this.configService.get('SMS_ACCOUNT_SID') || '';
            const authToken = this.configService.get('SMS_AUTH_TOKEN') || '';
            const fromNumber = this.configService.get('SMS_FROM_NUMBER') || '';
            const providerUrl = this.configService.get('SMS_PROVIDER_URL') || 'https://api.twilio.com';
            const url = `${providerUrl}/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const formData = new URLSearchParams();
            formData.append('To', message.destination);
            formData.append('From', fromNumber);
            formData.append('Body', message.content);
            await axios_1.default.post(url, formData, {
                auth: {
                    username: accountSid,
                    password: authToken,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'SmsService.send',
                correlationId: message.correlationId,
                notificationId: message.notificationId,
                destination: message.destination,
                message: 'SMS sent successfully',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'SmsService.send',
                correlationId: message.correlationId,
                notificationId: message.notificationId,
                destination: message.destination,
                message: 'Failed to send SMS',
                error: error.message,
            }));
            throw new channel_worker_exceptions_1.SmsSendException(message.destination, error.message);
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map