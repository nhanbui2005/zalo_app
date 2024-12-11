import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { hashPassword as hashPass } from '@/utils/password.util';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthProviderType } from '@/constants/entity.enum';

@Entity('auth_provider')
export class AuthProviderEntity extends AbstractEntity {
  constructor(data?: Partial<AuthProviderEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_auth_provider_id' })
  id!: Uuid;

  @Column({type:'enum', enum:AuthProviderType, name:'provider_type'})
  providerType: AuthProviderType

  //ex: googleId, faceboookId,....
  @Column({name:'provider_id',nullable:true})
  providerId?: string

  @Column({nullable:true, unique:true})
  email?: string;

  @Column({nullable:true})
  password?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await hashPass(this.password);
    }
  }
}
