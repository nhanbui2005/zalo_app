import { useEffect, useState } from 'react';
import { database } from '~/database';
import UserRepository from '~/database/repositories/UserRepository';
import { UserItemView } from '~/database/types/user.typee';
import { RelationStatus } from '~/features/relation/dto/relation.dto.enum';
import { userApi } from '~/features/user/userService'; 

export const useUserList = (status: RelationStatus) => {
  const userRepo = new UserRepository();
  const [users, setUsers] = useState<UserItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lấy dữ liệu từ cơ sở dữ liệu cục bộ
    const observable = userRepo.getAllUsersObservable(status);
    const subscription = observable.subscribe(async (localUsers) => {
      setUsers(localUsers);
      setIsLoading(false);

      if (localUsers.length === 0) {
        console.log('trống');
        
        try {
          const userRepository = new UserRepository();
          setIsLoading(true);

          const serverUsers = await userApi.getAllFriends();
          const userWithRelations = serverUsers.map((item) => ({
            user: item,
            relationStatus: RelationStatus.FRIEND
          }));          
          const preparedUsers = await userRepository.prepareUsers(userWithRelations);

          await userRepository.batchUsers(preparedUsers);
        } catch (error) {
          console.error('Error fetching users from API:', error);
          setIsLoading(false); // Dừng loading nếu có lỗi
        }
      }
    });

    // Cleanup subscription khi component unmount
    return () => subscription.unsubscribe();
  }, [status]); // Thêm status vào dependency array để gọi lại khi status thay đổi

  return { users, isLoading };
};