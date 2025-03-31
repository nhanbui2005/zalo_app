import { Injectable } from "@nestjs/common";
import { MemberEntity } from "./entities/member.entity";
import { DataSource, Repository } from "typeorm";


@Injectable()
export class MemberRepository extends Repository<MemberEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(MemberEntity, dataSource.createEntityManager());
    }
}