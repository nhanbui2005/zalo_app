import { EventEmitterModule } from "@nestjs/event-emitter";
import eventEmiterConfig from "./config/event-emitter.config";

export default EventEmitterModule.forRoot(eventEmiterConfig);
