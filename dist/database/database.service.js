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
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("mongoose");
const notificationLogSchema = new mongoose_1.default.Schema({
    notificationId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    channel: { type: String, required: true, index: true },
    destination: { type: String, required: true },
    status: { type: String, required: true, enum: ['sent', 'failed', 'retrying'] },
    attempts: { type: Number, required: true, default: 1 },
    error: { type: String, default: null },
    correlationId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
});
let DatabaseService = class DatabaseService {
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const uri = this.configService.get('MONGODB_URI') || 'mongodb://localhost:27017/notification_logs';
        try {
            const connection = await mongoose_1.default.connect(uri);
            this.connection = connection.connection;
            this.notificationLogModel = this.connection.model('NotificationLog', notificationLogSchema);
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'DatabaseService',
                message: 'Connected to MongoDB',
            }));
        }
        catch (error) {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                service: 'channel-worker',
                context: 'DatabaseService',
                message: 'Failed to connect to MongoDB',
                error: error.message,
            }));
            throw error;
        }
    }
    async createLog(log) {
        const notificationLog = new this.notificationLogModel(log);
        return notificationLog.save();
    }
    async updateLog(notificationId, update) {
        return this.notificationLogModel.findOneAndUpdate({ notificationId }, { $set: update }, { new: true });
    }
    async findByNotificationId(notificationId) {
        return this.notificationLogModel.findOne({ notificationId });
    }
    async findByCorrelationId(correlationId) {
        return this.notificationLogModel.find({ correlationId });
    }
    async findByProductId(productId) {
        return this.notificationLogModel.find({ productId });
    }
    async disconnect() {
        if (this.connection) {
            await mongoose_1.default.disconnect();
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'channel-worker',
                context: 'DatabaseService',
                message: 'Disconnected from MongoDB',
            }));
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map