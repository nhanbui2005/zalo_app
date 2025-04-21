import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Uuid } from '@/common/types/common.type';
import { MessageEntity } from '../../message/entities/message.entity';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { ChatRoomEntity } from '@/api/chat-room/entities/chat-room.entity';

@Entity('media')
export class MediaEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

  @Column({ type: 'varchar', name: 'url' })
  url: string;

  @Column({ type: 'varchar', name: 'public_id' })
  publicId: string;

  @Column({ type: 'varchar', name: 'format', nullable: true })
  format: string;

  @Column({ type: 'int', name: 'bytes', nullable: true })
  bytes: number;

  @Column({ type: 'int', name: 'width', nullable: true })
  width: number;

  @Column({ type: 'int', name: 'height', nullable: true })
  height: number;

  @Column({ type: 'float', name: 'duration', nullable: true })
  duration: number;

  @Column({ type: 'varchar', name: 'preview_url', nullable: true })
  previewUrl: string;

  @Column({ type: 'varchar', name: 'original_name', nullable: true })
  originalName: string;

  @Column({ type: 'varchar', name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({ type: 'varchar', name: 'type', nullable: true })
  type: string;

  @Column({ nullable: true })
  messageId: string;

  @Column({ nullable: true })
  roomId: string;

  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'messageId' })
  message: MessageEntity;

  @ManyToOne(() => ChatRoomEntity, { nullable: true })
  @JoinColumn({ name: 'roomId' })
  room: ChatRoomEntity;
} 