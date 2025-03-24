import { RelationStatus } from "~/features/relation/dto/relation.dto.enum";

export interface UserItemView {
    id: string,
    username: string,
    preferredName?: string,
    avatarUrl: string,
    relationStatus: RelationStatus
    isOnline: boolean
    lastedOnline: number
}