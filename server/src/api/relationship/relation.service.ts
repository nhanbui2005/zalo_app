import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SendRequestToAddFriendReqDto } from './dto/send-request.req.dto';
import { ActionHanleRequestRelation, HandleRequestToAddFriendReqDto } from './dto/handle-req.req.dto';
import { RelationEntity } from './entities/relation.entity';
import { RevokeRequestToAddFriendReqDto } from './dto/revoke-request.req.dto';
import { GetListRelationReqDto } from './dto/get-list.req.dto';
import { RelationResDto } from './dto/list-relation.res.dto';
import { UserEntity } from '../user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { RelationStatus } from '@/constants/entity.enum';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createEventKey } from '@/utils/socket.util';
import { EventKey } from '@/constants/event.constants';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { ErrorCode } from '@/constants/error-code.constant';
import { EventEmitterKey } from '@/constants/event-emitter.constant';

@Injectable()
export class RelationService {
  constructor(
    @InjectRepository(RelationEntity)
    private readonly relationRepository: Repository<RelationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private eventEmitter: EventEmitter2
  ){}

  async sendRequest(dto: SendRequestToAddFriendReqDto, senderId: Uuid): Promise<RelationResDto>{
    //validate data
    await this.userRepository.findOneByOrFail({id: dto.receiverId as Uuid})
    const relationExists = await this.relationRepository.findOne({
      where:[
        {requesterId: senderId, handlerId: dto.receiverId as Uuid},
        {requesterId: dto.receiverId as Uuid, handlerId: senderId},
      ]
    })
    if (relationExists) {
      throw new ValidationException(ErrorCode.RELATION_E001)
    }

    //create new relation
    const newRelation = new RelationEntity({
      requesterId: senderId,
      handlerId: dto.receiverId as Uuid,
      status: RelationStatus.PENDING,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
    })    
    await this.relationRepository.save(newRelation)    
    
    //sent notify to handler
    this.eventEmitter.emit(
      EventEmitterKey.SENT_REQUEST_ADD_FRIEND,
      {
        to: createEventKey(EventKey.NOTIFY_REQUEST_ADD_FRIEND_SENT,dto.receiverId.toString()),
        payload:{
          message:'ok',
          contain:'You have a request add friend.',
          from:senderId
        }
      }
    )

    return plainToInstance(RelationResDto, newRelation)
  }

  async handleRequest(dto: HandleRequestToAddFriendReqDto): Promise<RelationResDto>{
    
    //check relation exists
    const relation = await this.relationRepository.findOneBy({
      id: dto.relationId,
      status: RelationStatus.PENDING
    })
    
    if (!relation) {
      throw new ValidationException(ErrorCode.RELATION_E002)
    }

    if (
      dto.action === ActionHanleRequestRelation.REJECT ||
      dto.action === ActionHanleRequestRelation.REVOKE
    ) {
      await this.relationRepository.remove(relation)  
    }else{
      relation.status = RelationStatus.ACCEPTED
      await this.relationRepository.save(relation)

      //sent notify to requester
      this.eventEmitter.emit(
        EventEmitterKey.HANDLE_REQUEST_ADD_FRIEND,
        {
          to: createEventKey(EventKey.NOTIFY_REQUEST_ADD_FRIEND_SENT,relation.requesterId.toString()),
          payload:{
            message:'ok',
            contain:'You have a request add friend.',
            from:relation.handlerId
          }
        }
      )
    }

    return plainToInstance(RelationResDto, relation)
  }

  async getAllRelations(dto: GetListRelationReqDto) : Promise<RelationResDto[]>{

    return null
  }

  
  // async create(dto: CreateFriendDto): Promise<FriendEntity> {
  //   const {userId, partnerId, actionType} = dto
  //   let friendRealate = await FriendEntity.findOneOrFail({
  //     where:{
  //       requirerId: In([userId, partnerId]),
  //       accepterId: In([userId, partnerId])
  //     }
  //   })

  //   switch (actionType) {
  //     case ActionFriendType.SENT:
  //       if (friendRealate) {
  //         throw new Error()
  //       }
  //       friendRealate = new FriendEntity({
  //         requirerId: userId,
  //         accepterId: partnerId,
  //         status: this.getFriendStatus(actionType)
  //       })
  //       await friendRealate.save()
  //     case ActionFriendType.REJECT:
  //       if (!friendRealate || friendRealate.status === FriendStatus.PENDING) {
  //         throw new Error()
  //       }
  //       await this.friendRepository.delete(friendRealate.id)
  //     case ActionFriendType.ACCEPT:
  //       if (!friendRealate || friendRealate.status === FriendStatus.PENDING) {
  //         throw new Error()
  //       }
  //       friendRealate.status = this.getFriendStatus(actionType)
  //       await this.friendRepository.save(friendRealate)
  //     case ActionFriendType.BLOCK:
  //       friendRealate.status = this.getFriendStatus(actionType)
  //       await this.friendRepository.save(friendRealate)
  //     default:
  //       break;
  //   }
  //   return friendRealate;
  // }

  // async sendRequireAddFriend(requirerId: Uuid, partnerId: Uuid){
  //   const friend = await this.findFriendRelation(requirerId, partnerId)
  //   if (friend.status) {
  //     throw new ValidationException(ErrorCode.FRIEND_E001)
  //   }
  //   const relation = await this.friendRepository.save(new FriendEntity({
  //     requirerId: requirerId,
  //     accepterId: partnerId,
  //     status: FriendStatus.PENDING
  //   }))

  //   return plainToInstance(FriendResDto, relation)
  // }

  // async acceptOrRejectRequestAddFriend(dto: AcceptOrRejectReqFriendDto){
  //   const friend = await this.friendRepository.findOneByOrFail({id: dto.relationId})
  //   if (dto.action === AcctionHanldeRequireAddFriend.REJECT) {
  //     await this.friendRepository.delete(friend.id)
  //   }else{
  //     friend.status = FriendStatus.ACCEPTED
  //     await this.friendRepository.save(friend)
  //   }
  //   return null
  // }

  // private async findFriendRelation(userId1:Uuid, userId2:Uuid): Promise<FriendEntity>{
  //   return await this.friendRepository.findOneBy([
  //     {
  //       requirerId: userId1,
  //       accepterId: userId2
  //     },
  //     {
  //       requirerId: userId2,
  //       accepterId: userId1
  //     }
  //   ])
  // }

  // private getFriendStatus(action: ActionFriendType){
  //   switch (action) {
  //     case ActionFriendType.SENT:
  //       return FriendStatus.PENDING
  //     case ActionFriendType.ACCEPT:
  //       return FriendStatus.ACCEPTED
  //     case ActionFriendType.BLOCK:
  //       return FriendStatus.BLOCKED
  //     default:
  //       throw new Error();
  //   }
  // }
}

