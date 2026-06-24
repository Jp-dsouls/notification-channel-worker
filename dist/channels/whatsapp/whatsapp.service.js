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
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const channel_worker_exceptions_1 = require("../../common/exceptions/channel-worker.exceptions");
let WhatsappService = class WhatsappService {
    constructor(configService) {
        this.configService = configService;
    }
    async send(message) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'channel-worker',
            context: 'WhatsappService.send',
            correlationId: message.correlationId,
            notificationId: message.notificationId,
            destination: message.destination,
            message: 'Sending WhatsApp message',
        }));
        try {
            const accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
            const phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
            const providerUrl = this.configService.get('WHATSAPP_PROVIDER_URL');
            const url = `${providerUrl}/${phoneNumberId}/messages`;
            await axios_1.default.post(url, {
                messaging_product: 'whatsapp',
                to: message.destination,
                type: 'text',
                text: {
                    body: message.content,
                },
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'WhatsappService.send',
                correlationId: message.correlationId,
                notificationId: message.notificationId,
                destination: message.destination,
                message: 'WhatsApp message sent successfully',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'WhatsappService.send',
                correlationId: message.correlationId,
                notificationId: message.notificationId,
                destination: message.destination,
                message: 'Failed to send WhatsApp message',
                error: error.message,
            }));
            throw new channel_worker_exceptions_1.WhatsappSendException(message.destination, error.message);
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map