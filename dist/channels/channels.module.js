"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsModule = void 0;
const common_1 = require("@nestjs/common");
const email_module_1 = require("./email/email.module");
const sms_module_1 = require("./sms/sms.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const channel_dispatcher_service_1 = require("./channel-dispatcher.service");
let ChannelsModule = class ChannelsModule {
};
exports.ChannelsModule = ChannelsModule;
exports.ChannelsModule = ChannelsModule = __decorate([
    (0, common_1.Module)({
        imports: [email_module_1.EmailModule, sms_module_1.SmsModule, whatsapp_module_1.WhatsappModule],
        providers: [channel_dispatcher_service_1.ChannelDispatcherService],
        exports: [channel_dispatcher_service_1.ChannelDispatcherService],
    })
], ChannelsModule);
//# sourceMappingURL=channels.module.js.map