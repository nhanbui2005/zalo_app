export enum RelationStatus{
  NOTTHING = 'notthing',
  PENDING =  'pending',
  FRIEND = 'friend',
  BLOCKED = 'blocked'
}

export enum RelationAction{
  SENT =  'sent',
  REVOKE = 'revoke',
  ACCEPT = 'accept',
  DECLINE = 'decline',
  BLOCK = 'block'
}


export enum InviterType {
  SELF = "self",
  OTHER = "other",
}
