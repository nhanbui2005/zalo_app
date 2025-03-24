import {useEffect, useState} from 'react';
import {database} from '~/database';
import {_MessageSentRes} from '~/features/message/dto/message.dto.parent';
import RoomRepository from '~/database/repositories/RoomRepository';
import { RoomItemView } from '~/database/types/room.type';

export const useRoomList = () => {
  const roomRepo = new RoomRepository();
  const [rooms, setRooms] = useState<RoomItemView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const observable = roomRepo.getRoomsWithLastMessageObservable();
    const subscription = observable.subscribe(rooms => {
      setRooms(rooms);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {rooms, isLoading};
};
