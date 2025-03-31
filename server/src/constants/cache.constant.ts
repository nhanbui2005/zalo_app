export enum CacheKey {
  SESSION_BLACKLIST = 'auth:session-blacklist:%s', // %s: sessionId
  EMAIL_VERIFICATION = 'auth:token:%s:email-verification', // %s: userId
  PASSWORD_RESET = 'auth:token:%s:password', // %s: userId
  MSG_SOCKET_CONNECT = 'socket-msg-connect:%s', // %s: clientId in socket
  NOTI_SOCKET_CONNECT = 'socket_noti_connect:%s', //userId
  MEMBER_CLIENT = 'member:%s', //clientId
  USER_CLIENT = 'user:%s', //clientId
  //messages
  UNRECEIVE_MSG = 'unreceive-msg:%s', //userId
  JOIN_ROOM = 'join-room:%s', //clientId
  EMOJI_MESSAGE = 'emoji-message:%s',

  //relation
  UNRECEIVE_HANDLE_REQUEST_RELATION = 'unreceive-handle-request-relation:%s',
  

  //notification
  FCM_TOKEN = 'fcm-token:%s',
  CLIENT_ALIVE = 'client-alive:%s',
}
