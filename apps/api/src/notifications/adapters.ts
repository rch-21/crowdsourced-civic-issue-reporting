import type {NotificationAdapter,NotificationChannel,NotificationMessage} from './types.js';
class ConsoleAdapter implements NotificationAdapter{constructor(public channel:NotificationChannel){} async send(message:NotificationMessage){return {providerMessageId:`dev-${message.event}-${Date.now()}`};}}
export const adapters:Record<NotificationChannel,NotificationAdapter>={PUSH:new ConsoleAdapter('PUSH'),EMAIL:new ConsoleAdapter('EMAIL'),SMS:new ConsoleAdapter('SMS'),WHATSAPP:new ConsoleAdapter('WHATSAPP'),IVR:new ConsoleAdapter('IVR')};
