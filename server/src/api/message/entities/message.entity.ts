import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatRoomEntity } from "../../chat-room/entities/chat-room.entity";
import { MemberEntity } from "../../members/entities/member.entity";
import { MediaEntity } from "../../media/entities/media.entity";
import { MessageContentType, MessageViewStatus } from "@/constants/entity.enum";
import { Uuid } from "@/common/types/common.type";
import { AbstractEntity } from "@/database/entities/abstract.entity";

@Entity('message')
export class MessageEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

  @Column({
    name:'reply_message_id',
    nullable: true
  })
  replyMessageId?: Uuid;

  @Column({
    name:'content',
    type: 'text',
    nullable: true
  })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageContentType,
    default: MessageContentType.TEXT
  })
  type: MessageContentType;

  @Column({
    type: 'enum',
    enum: MessageViewStatus,
    default: MessageViewStatus.SENT
  })
  status: MessageViewStatus;

  @Column()
  senderId!: string;

  @Column({ name: 'room_id' })
  roomId!: string;

  @ManyToOne(()=>MemberEntity, (member) => member.messages)
  @JoinColumn({name:'sender_id'})
  sender!: MemberEntity;

  @ManyToOne(()=>ChatRoomEntity, (room) => room.messages)
  @JoinColumn({name:'room_id'})
  room!: ChatRoomEntity;

  @OneToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({name:'reply_message_id'})
  replyMessage?: MessageEntity;

  @OneToMany(() => MediaEntity, media => media.message)
  media: MediaEntity[];
}
