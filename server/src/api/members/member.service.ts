import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MemberEntity } from "./entities/member.entity";
import { Repository } from "typeorm";
import { Uuid } from "@/common/types/common.type";


@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(MemberEntity)
        private readonly memberRepository: Repository<MemberEntity>,

    ) {}

    async getMembersByRoomId(roomId: Uuid): Promise<MemberEntity[]> {
        return await this.memberRepository.find({where: {roomId: roomId}})
    }
}