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




// export const syncWhenFriendConnect = async ( friendStatus: FriendStatusSocket):Promise<void> => {
//     try {
// }