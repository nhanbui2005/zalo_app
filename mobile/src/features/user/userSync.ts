import UserRepository from "~/database/repositories/UserRepository";
import { _UserRes } from "./dto/user.dto.parent";
import { RelationStatus } from "../relation/dto/relation.dto.enum";
import { _RoomRes } from "../room/dto/room.dto.parent";
import { _MessageSentRes } from "../message/dto/message.dto.parent";

export async function syncUsers(
    userWithRelations: {user: _UserRes, relationStatus: RelationStatus}[],
    userRepository: UserRepository
) : Promise<void> {
    const preparedUsers = await userRepository.prepareUsers(userWithRelations);
    await userRepository.batchUsers(preparedUsers);
}

export async function syncUserStatus(
  userId: string, 
  receivedAt: number,
  userRepository: UserRepository
): Promise<void> {
  try {
    await userRepository.updateUserStatus(userId, {
      isOnline: true,
      lastOnline: receivedAt,
    });

    console.log(`Cập nhật trạng thái thành công cho user: ${userId}`);
  } catch (error) {
    console.error(`Lỗi khi cập nhật trạng thái user ${userId}:`, error);
  }
}

  


