import { RelationStatus } from "~/features/relation/dto/relation.dto.enum";
import { _RoomRes } from "~/features/room/dto/room.dto.parent";
import { UserBase } from "~/features/user/dto/user.dto.nested";

export interface HandleAcceptReqDataSocket {
    status: RelationStatus,
    memberId: string,
    memberMeId: string,
    room: _RoomRes,
    user: UserBase,
}