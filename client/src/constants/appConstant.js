const PORT = '7777';
const HOT_IP = '192.168.1.21';

export const SOCKET_UR = `http://${HOT_IP}:${PORT}/`;
export const API_URL = `http://${HOT_IP}:${PORT}/api/v1/`;

export const AppConstant = {
  LOCAL_STORAGE_ACCESS_TOKEN_KEY: 'accessToken',
  LOCAL_STORAGE_REFRESH_TOKEN_KEY: 'refreshToken'
}

export const ActionHandleAddFriend = {
  ACCEPT: 'accept',
  REVOKE: 'revoke',
  DECLINE: 'decline',
  BLOCK: 'block'
}