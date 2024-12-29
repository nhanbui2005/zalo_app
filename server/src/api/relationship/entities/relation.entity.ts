import { UserEntity } from "@/api/user/entities/user.entity";
import { Uuid } from "@/common/types/common.type";
import { RelationStatus } from "@/constants/entity-enum/relation.enum";
import { AbstractEntity } from "@/database/entities/abstract.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('relation')
export class RelationEntity extends AbstractEntity {
  constructor(data?: Partial<RelationEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_relation_id' })
  id!: Uuid;

  @Column({type:'uuid', name:'requester_id'})
  requesterId!: Uuid;

  @Column({type:'uuid', name:'handler_id'})
  handlerId!: Uuid;

  @Column({type:'enum', enum:RelationStatus})
  status!: RelationStatus;

  @ManyToOne(()=> UserEntity, (user)=> user.relationRequests)
  @JoinColumn({
    name: 'requester_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_relation_requester_user',
  })
  requester: UserEntity

  @ManyToOne(()=> UserEntity, (user) => user.relationPendings)
  @JoinColumn({
    name: 'handler_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_relation_handler_user',
  })
  handler: UserEntity
}
