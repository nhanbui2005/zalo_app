import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { Room } from './dto/room.dto.nested';
import { database } from '~/database';
import RoomModel from '~/database/models/RoomModel';
import { MessageContentType, MessageViewStatus } from '../message/dto/message.enum';
import RoomRepository from '~/database/repositories/RoomRepository';
import MessageRepository from '~/database/repositories/MessageRepository';
import { _MessageSentRes } from '../message/dto/message.dto.parent';
import { Q } from '@nozbe/watermelondb';

// Hàm syncNewRoom
