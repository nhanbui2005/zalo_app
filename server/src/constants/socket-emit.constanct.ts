export enum SocketEmitKey {
  LOAD_MORE_MSGS_WHEN_CONNECT = 'load_more_msgs_when_connect',
  RECEIVED_MSG = 'received_msg',
  WRITING_MESSAGE = 'writing_message',
  RECEIVED_RELATION_REQ = 'received_relation_req',
  ACCEPT_RELATION_REQ = 'accept_relation_req',
  
  NEW_MESSAGE = 'new_message',
  FRIEND_STATUS = 'friend_status',
  EMOJIS_WHEN_CONNECT = 'emojis_when_connect',
  EMOJI_MESSAGE = 'emojis-message',
  
  // File handling
  FILE_STREAM = 'file_stream',
  FILE_CHUNK = 'file_chunk',
  FILE_COMPLETE = 'file_complete',
  FILE_PROGRESS = 'file_progress'
}
