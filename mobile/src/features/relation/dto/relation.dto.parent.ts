import { Room } from "~/features/room/dto/room.dto.nested"
import { RelationAction, RelationStatus } from "./relation.dto.enum"
import { Relation } from "./relation.dto.nested"
import { UserEntity } from "~/features/user/userEntity"
import { _UserRes } from "~/features/user/dto/user.dto.parent"
import { _RoomRes } from "~/features/room/dto/room.dto.parent"

export interface _SendRequestReq {
    receiverId: string
}
export interface _SendRequestRes {
    id: string,
    requesterId: string,
    handlerId: string,
    status: RelationStatus,
    createdAt: Date,
    updatedAt: Date,
    room?: Room
}


export interface _HandleRequestReq {
    relationId: string,
    action: RelationAction 
}
export interface _HandleRequestRes {
    id: string,
    requesterId: string,
    handlerId: string,
    status: RelationStatus,
    createdAt: Date,
    updatedAt: Date,
    room?: _RoomRes
    user?: _UserRes
}
    