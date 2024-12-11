import { Uuid } from "@/common/types/common.type";
import { RoomType } from "@/constants/entity.enum";
import { AbstractEntity } from "@/database/entities/abstract.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MessageEntity } from "./message.entity";
import { MemberEntity } from "./member.entity";

const MEMBER_LIMIT = 99

@Entity('chatroom')
export class ChatRoomEntity extends AbstractEntity {
  constructor(data?: Partial<ChatRoomEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_chat_room_id' })
  id!: Uuid;

  // @Column({type:'uuid', name:'sender_id'})
  // senderId!: Uuid

  // //personal
  // @Column({type:'uuid', name:'receiver_id'})
  // receiverId: Uuid

  @Column({type:'enum', enum:RoomType})
  type!: RoomType

  @Column({name:'group_name', nullable: true})
  groupName?: string

  @Column({name:'group_avatar', nullable: true})
  groupAvatar?: string

  @Column({name:'member_limit', type:'integer', default:MEMBER_LIMIT})
  memberLimit: number = MEMBER_LIMIT

  @ManyToMany(()=>MemberEntity)
  @JoinTable()
  members: MemberEntity[]

  @OneToMany(()=>MessageEntity,(message) => message.room)
  messages!: MessageEntity[]
}
