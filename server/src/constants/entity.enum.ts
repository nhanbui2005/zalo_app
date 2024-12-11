export enum AuthProviderType {
  EMAIL_PASSWORD = 'email_password',
  GOOGLE = 'google',
}

export enum Role{
  SUPER_ADMIN =  'supperadmin',
  ADMIN = 'admin',
  USER = 'user'
}

export enum RelationStatus{
  PENDING =  'pending',
  ACCEPTED = 'acceped',
  BLOCKED = 'blocked'
}

export enum ActionRelationType{
  SENT =  'sent',
  ACCEPT = 'accept',
  REJECT = 'reject',
  BLOCK = 'block'
}

export enum RoomType{
  PERSONAL = 'personal',
  GROUP = 'group'
}

export enum MemberRole{
  LEADER = 'leader',
  VICER = 'vicer',
  MEMBER = 'member'
}

export enum MessageViewStatus{
  SENT = 'sent',
  RECEIVED = 'received',
  VIEWED = 'viewed',
  REVOKED = 'revoked',
}

export enum MessageContentType{
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  FILE = 'file',
}

export enum Gender{
  MALE = 'male',
  FEMALE = 'female'
}