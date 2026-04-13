export const buildDirectConversationId = (firstUid: string, secondUid: string) =>
  [firstUid, secondUid].sort().join('__')

export const getOtherConversationParticipant = (
  participants: string[],
  currentUid: string,
) => participants.find((uid) => uid !== currentUid) ?? null
