import { AuthProviderEntity } from '@/api/user/entities/auth-provider.entity';
import { RoleEntity } from '@/api/user/entities/role.entity';
import { UserEntity } from '@/api/user/entities/user.entity';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { AuthProviderType, Role } from '@/constants/entity.enum';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class UserSeeder1722335726360 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const userRepository = dataSource.getRepository(UserEntity);
    const roleRepository = dataSource.getRepository(RoleEntity);    
    const authProviderRepository = dataSource.getRepository(AuthProviderEntity);
    
    const roles = await roleRepository.find()
    
    const supperAdmin = new UserEntity({
      username: 'supper admin',
      avatarUrl:'url',
      isVerify: true,
      roles:[roles.find(item => item.rolename === Role.SUPER_ADMIN)],
      createdBy:SYSTEM_USER_ID,
      updatedBy:SYSTEM_USER_ID
    })
    const admin = new UserEntity({
      username: 'admin',
      avatarUrl:'url',
      isVerify: true,
      roles:[roles.find(item => item.rolename === Role.ADMIN)],
      createdBy:SYSTEM_USER_ID,
      updatedBy:SYSTEM_USER_ID
    })
    const user = new UserEntity({
      username: 'user',
      avatarUrl:'url',
      isVerify: true,
      roles:[roles.find(item => item.rolename === Role.USER)],
      createdBy:SYSTEM_USER_ID,
      updatedBy:SYSTEM_USER_ID
    })

    await userRepository.save([supperAdmin, admin, user])
    
    const supperAdminProvider = new AuthProviderEntity({
      providerType: AuthProviderType.EMAIL_PASSWORD,
      email: 'supperadmin@example.com',
      password: '12345678',
      // userId: supperAdmin.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
    })
    const adminProvider = new AuthProviderEntity({
      providerType: AuthProviderType.EMAIL_PASSWORD,
      email: 'admin@example.com',
      password: '12345678',
      // userId: admin.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
    })
    const userProvider = new AuthProviderEntity({
      providerType: AuthProviderType.EMAIL_PASSWORD,
      email: 'user@example.com',
      password: '12345678',
      // userId: user.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
    })

    await authProviderRepository.save([supperAdminProvider, adminProvider, userProvider])    

    const userFactory = factoryManager.get(UserEntity);
    const users = await userFactory.saveMany(20,{roles:[roles.find(item => item.rolename === Role.USER)]});
    
    const authProviders =  users.map((user, index) => {
      return new AuthProviderEntity({
        providerType: AuthProviderType.EMAIL_PASSWORD,
        email: `user${index + 1}@example.com`,
        password: '12345678', // Mã hóa mật khẩu nếu cần
        // userId: user.id,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
    })

    await authProviderRepository.save(authProviders);
  }
}
