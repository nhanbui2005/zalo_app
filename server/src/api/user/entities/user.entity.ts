import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { RoleEntity } from './role.entity';
import { RelationEntity } from '@/api/relationship/entities/relation.entity';
import { Gender } from '@/constants/entity.enum';
import { MemberEntity } from '@/api/message/entities/member.entity';

const DEFAULT_AVATAR_URL = 'https://gravatar.com/avatar/6d280e4498beb5ccc61ab02afbd18d78?s=400&d=robohash&r=x'
@Entity('user')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_user_id' })
  id!: Uuid;

  @Column({
    length: 50,
    nullable: true,
  })
  username: string;

  @Column({
    nullable: true,
  })
  bio?: string;

  @Column({
    type: 'date',
    nullable: true
  })
  dob?: Date

  @Column({
    nullable: true,
    type: 'enum',
    enum: Gender
  })
  gender?: Gender

  @Column({nullable:true, unique:true})
  email?: string;

  @Column({name:'avatar_url', default: DEFAULT_AVATAR_URL })
  avatarUrl?: string;

  @Column({name:'avatar_pid', nullable:true })
  avatarPid?: string;

  @Column({ name: 'cover_url', default: DEFAULT_AVATAR_URL })
  coverUrl?: string;

  @Column({name:'cover_pid', nullable:true })
  coverPid?: string;

  @Column({name:'is_active', default:true})
  isActive: boolean

  @Column({name:'is_verify', default:false})
  isVerify: boolean

  @Column({name:'last_accessed', default: new Date()})
  lastAccessed: Date

  //client socket id
  @Column({name:'client_id', nullable:true})
  clientId: Uuid

  @Column({name:'is_online', default: false})
  isOnline: boolean
  
  @Column({name:'lastOnline', default: new Date()})
  lastOnline: Date
  
  @OneToMany(() => SessionEntity,(session) => session.user)
  sessions?: SessionEntity[]

  @OneToMany(() => MemberEntity,(members) => members.user)
  members?: SessionEntity[]

  @ManyToMany(() => RoleEntity)
  @JoinTable()
  roles?: RoleEntity[]

  @OneToMany(()=>RelationEntity, (relation) => relation.requester)
  relationRequests: RelationEntity[]

  @OneToMany(()=>RelationEntity, (relation) => relation.handler)
  relationPendings: RelationEntity[]

  @Column({name: 'auth_provider_id'})
  authProviderId!: Uuid

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;
}
