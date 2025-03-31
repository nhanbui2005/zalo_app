import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { LoggerMiddleware } from "src/middleware/guard-socket.middleware";
import { MemberService } from "./member.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MemberEntity } from "./entities/member.entity";


@Module({
    imports:[
        TypeOrmModule.forFeature([
            MemberEntity
        ])
    ],
    controllers:[],
    
    providers:[MemberService],
    exports: [MemberService]
})

export class MemberModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware)
    }
}