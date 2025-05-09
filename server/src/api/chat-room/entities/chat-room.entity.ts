import { Uuid } from "@/common/types/common.type";
import { RoomType } from "@/constants/entity.enum";
import { AbstractEntity } from "@/database/entities/abstract.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MessageEntity } from "../../message/entities/message.entity";
import { MemberEntity } from "../../members/entities/member.entity";

const MEMBER_LIMIT = 99

@Entity('chatroom')
export class ChatRoomEntity extends AbstractEntity {
  constructor(data?: Partial<ChatRoomEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_chat_room_id' })
  id!: Uuid;

  @Column({type:'enum', enum:RoomType})
  type!: RoomType

  @Column({name:'room_name', nullable: true})
  roomName?: string

  @Column({name:'room_avatar', nullable: true})
  roomAvatar?: string

  @Column({name:'member_limit', type:'integer', default:MEMBER_LIMIT})
  memberLimit: number = MEMBER_LIMIT

  @OneToMany(()=>MemberEntity, (member) => member.room)
  members: MemberEntity[]

  @OneToMany(()=>MessageEntity,(message) => message.room)
  messages: MessageEntity[]
}
