import { UserFriend, UserSearch } from "./user.dto.nested"
import { InviterTypeEnum } from "./user.enum"


export interface UserSearchRes {
    id: string,
    status: string,
    inviter: InviterTypeEnum,
    user: UserSearch
}
export interface _UserRes {
    id: string;
    username: string;
    email: string;
    gender: string;
    dob: string;
    bio?: string;
    avatarUrl: string;
    avatarPid: string;
    coverUrl: string;
    coverPid: string;
    createdAt: Date;
    updatedAt: Date;
}