import { Uuid } from "@/common/types/common.type";
import { MessageContentType, MessageViewStatus } from "@/constants/entity.enum";
import { AbstractEntity } from "@/database/entities/abstract.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatRoomEntity } from "./chat-room.entity";
import { MemberEntity } from "./member.entity";

@Entity('message')
export class MessageEntity extends AbstractEntity{
  constructor(data?: Partial<MessageEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_message_id',
  })
  id!: Uuid;

  @Column({
    name:'sender_id'
  })
  senderId!: string;

  @Column({
    name:'room_id'
  })
  roomId!: string;

  @Column()
  content: string;

  @Column({name: 'sub_content', nullable:true})
  subContent?: string;

  @Column({type:'enum', enum: MessageContentType})
  type: MessageContentType;

  @Column({name:'reply_message_id', nullable: true})
  replyMessageId?: Uuid;

  @Column({type:'enum', enum:MessageViewStatus})
  status: MessageViewStatus

  @ManyToOne(()=>MemberEntity)
  @JoinColumn({
    name:'sender_id',
    referencedColumnName:'id',
    foreignKeyConstraintName:'FK_message_sender'
  })
  sender!: MemberEntity

  @ManyToOne(()=>ChatRoomEntity)
  @JoinColumn({
    name:'room_id',
    referencedColumnName:'id',
    foreignKeyConstraintName:'FK_message_chatroom'
  })
  room!: ChatRoomEntity

  @OneToOne(()=>MessageEntity)
  @JoinColumn({
    name:'reply_message_id',
    referencedColumnName:'id',
    foreignKeyConstraintName:'FK_replymessage_message'
  })
  messageReply: MessageEntity
}
