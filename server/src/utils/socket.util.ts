import { EventKey } from '@/constants/event.constants';
import util from 'util';

export const createEventKey = (key: EventKey, ...args: string[]): string => {
  return util.format(key, ...args);
};
