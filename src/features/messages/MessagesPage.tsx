import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { Link, useSearchParams } from 'react-router-dom'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { buildDirectConversationId, getOtherConversationParticipant } from '../../lib/messages'
import { routes } from '../../routes/paths'
import type { DirectConversation, ConversationMessage } from '../../types/Conversation'
import type { UserProfile } from '../../types/User'

const toDisplayName = (profile?: Partial<UserProfile> | null) => {
  if (profile?.fullName?.trim()) return profile.fullName.trim()
  return profile?.email?.split('@')[0] ?? 'Medlem'
}

const formatMessageTime = (value?: ConversationMessage['createdAt']) => {
  if (!value) return 'Nu'

  const date = value.toDate()
  return new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

const getMessageErrorText = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'permission-denied'
  ) {
    return 'Meddelanden blockeras av Firestore-reglerna just nu. Deploya firestore.rules och prova igen.'
  }

  return 'Det gick inte att skicka meddelandet. Försök igen.'
}

const MessagesPage = () => {
  const { currentUser, profile } = useAuth()
  const dbClient = db
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState<DirectConversation[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [profilesByUid, setProfilesByUid] = useState<Record<string, Partial<UserProfile>>>({})
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  const targetUid = searchParams.get('with')?.trim() ?? ''
  const selectedConversationParam = searchParams.get('conversation')?.trim() ?? ''

  useEffect(() => {
    if (!dbClient || !currentUser) {
      setConversations([])
      setLoadingConversations(false)
      return
    }

    const conversationsQuery = query(
      collection(dbClient, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
    )

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const nextConversations = snapshot.docs
          .map((entry) => {
            const data = entry.data() as Omit<DirectConversation, 'id'>
            return {
              id: entry.id,
              ...data,
            }
          })
          .sort((left, right) => {
            const leftTime =
              left.updatedAt?.toMillis() ?? left.lastMessageAt?.toMillis() ?? left.createdAt?.toMillis() ?? 0
            const rightTime =
              right.updatedAt?.toMillis() ?? right.lastMessageAt?.toMillis() ?? right.createdAt?.toMillis() ?? 0
            return rightTime - leftTime
          })

        setConversations(nextConversations)
        setLoadingConversations(false)
      },
      (error) => {
        console.error('Failed to watch conversations', error)
        setConversations([])
        setLoadingConversations(false)
      },
    )

    return () => unsubscribe()
  }, [currentUser, dbClient])

  const activeConversationId = useMemo(() => {
    if (!currentUser) return ''
    if (selectedConversationParam) return selectedConversationParam
    if (targetUid && targetUid !== currentUser.uid) {
      return buildDirectConversationId(currentUser.uid, targetUid)
    }
    return conversations[0]?.id ?? ''
  }, [conversations, currentUser, selectedConversationParam, targetUid])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  )

  const activeTargetUid = useMemo(() => {
    if (!currentUser) return ''
    if (activeConversation) {
      return getOtherConversationParticipant(activeConversation.participants, currentUser.uid) ?? ''
    }
    if (targetUid && targetUid !== currentUser.uid) return targetUid
    return ''
  }, [activeConversation, currentUser, targetUid])

  useEffect(() => {
    if (!dbClient || !currentUser) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    if (!activeConversation || !activeConversationId || !activeTargetUid) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    setLoadingMessages(true)
    const messagesQuery = query(collection(dbClient, 'conversations', activeConversationId, 'messages'))
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs
          .map((entry) => {
            const data = entry.data() as Omit<ConversationMessage, 'id'>
            return {
              id: entry.id,
              ...data,
            }
          })
          .sort((left, right) => {
            const leftTime = left.createdAt?.toMillis() ?? 0
            const rightTime = right.createdAt?.toMillis() ?? 0
            return leftTime - rightTime
          })

        setMessages(nextMessages)
        setLoadingMessages(false)
      },
      (error) => {
        console.error('Failed to watch messages', error)
        setMessages([])
        setLoadingMessages(false)
      },
    )

    return () => unsubscribe()
  }, [activeConversation, activeConversationId, activeTargetUid, currentUser, dbClient])

  useEffect(() => {
    if (!dbClient || !currentUser) return

    const uidsToLoad = new Set<string>()
    conversations.forEach((conversation) => {
      const counterpartUid = getOtherConversationParticipant(conversation.participants, currentUser.uid)
      if (counterpartUid && !profilesByUid[counterpartUid]) {
        uidsToLoad.add(counterpartUid)
      }
    })

    if (activeTargetUid && !profilesByUid[activeTargetUid]) {
      uidsToLoad.add(activeTargetUid)
    }

    if (uidsToLoad.size === 0) return

    const loadProfiles = async () => {
      const entries = await Promise.all(
        Array.from(uidsToLoad).map(async (uid) => {
          try {
            const profileSnap = await getDoc(doc(dbClient, 'publicProfiles', uid))
            return [uid, profileSnap.exists() ? (profileSnap.data() as Partial<UserProfile>) : { uid }] as const
          } catch (error) {
            console.error('Failed to load conversation profile', error)
            return [uid, { uid }] as const
          }
        }),
      )

      setProfilesByUid((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }))
    }

    loadProfiles()
  }, [activeTargetUid, conversations, currentUser, dbClient, profilesByUid])

  const activeTargetProfile = activeTargetUid ? profilesByUid[activeTargetUid] : null
  const activeDisplayName =
    activeTargetUid === profile?.uid ? toDisplayName(profile) : toDisplayName(activeTargetProfile)

  const openConversation = (conversationId: string, counterpartUid: string) => {
    const nextParams = new URLSearchParams()
    nextParams.set('conversation', conversationId)
    nextParams.set('with', counterpartUid)
    setSearchParams(nextParams)
  }

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dbClient || !currentUser || !activeTargetUid || sending) return

    const body = draft.trim()
    if (!body) return

    const conversationId = buildDirectConversationId(currentUser.uid, activeTargetUid)
    const conversationRef = doc(dbClient, 'conversations', conversationId)
    setSending(true)
    setSendError(null)

    try {
      await setDoc(
        conversationRef,
        {
          participants: [currentUser.uid, activeTargetUid].sort(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          lastMessageSenderUid: currentUser.uid,
          lastMessageText: body,
        },
        { merge: true },
      )

      await addDoc(collection(dbClient, 'conversations', conversationId, 'messages'), {
        senderUid: currentUser.uid,
        body,
        createdAt: serverTimestamp(),
      })

      setDraft('')
      openConversation(conversationId, activeTargetUid)
    } catch (error) {
      console.error('Failed to send message', error)
      setSendError(getMessageErrorText(error))
    } finally {
      setSending(false)
    }
  }

  return (
    <BrandPageShell title="MEDDELANDEN" subtitle="Ta kontakt med andra medlemmar direkt." memberNav>
      <section className="messages-layout">
        <article className="brand-panel messages-sidebar-panel">
          <div className="messages-panel-header">
            <h3>Samtal</h3>
            <p className="muted">Alla dina direkta konversationer visas här.</p>
          </div>

          {loadingConversations ? (
            <p className="muted">Laddar samtal...</p>
          ) : conversations.length > 0 ? (
            <div className="messages-thread-list">
              {conversations.map((conversation) => {
                const counterpartUid =
                  currentUser ? getOtherConversationParticipant(conversation.participants, currentUser.uid) ?? '' : ''
                const counterpartProfile = profilesByUid[counterpartUid]
                const isActive = conversation.id === activeConversationId

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`messages-thread-card ${isActive ? 'active' : ''}`}
                    onClick={() => openConversation(conversation.id, counterpartUid)}
                  >
                    <strong>{toDisplayName(counterpartProfile)}</strong>
                    <span>{conversation.lastMessageText ?? 'Starta samtalet'}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="muted">Inga samtal än. Öppna en medlemsprofil och klicka på Kontakta.</p>
          )}
        </article>

        <article className="brand-panel messages-chat-panel">
          {activeTargetUid ? (
            <>
              <div className="messages-panel-header">
                <div>
                  <h3>{activeDisplayName}</h3>
                  <p className="muted">Direktmeddelanden mellan medlemmar.</p>
                </div>
                <Link className="btn ghost" to={routes.profileView(activeTargetUid)}>
                  Visa profil
                </Link>
              </div>

              <div className="messages-log">
                {loadingMessages ? (
                  <p className="muted">Laddar meddelanden...</p>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isMine = message.senderUid === currentUser?.uid
                    return (
                      <article
                        key={message.id}
                        className={`message-bubble ${isMine ? 'outgoing' : 'incoming'}`}
                      >
                        <p>{message.body}</p>
                        <span>{formatMessageTime(message.createdAt)}</span>
                      </article>
                    )
                  })
                ) : (
                  <p className="muted">
                    Inga meddelanden än. Skriv första meddelandet för att starta kontakten.
                  </p>
                )}
              </div>

              <form className="messages-composer" onSubmit={handleSendMessage}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder={`Skriv ett meddelande till ${activeDisplayName}...`}
                />
                <div className="messages-composer-actions">
                  {sendError && <p className="error">{sendError}</p>}
                  <button type="submit" className="btn primary" disabled={sending || !draft.trim()}>
                    {sending ? 'Skickar...' : 'Skicka meddelande'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="messages-empty-state">
              <h3>Välj en medlem att kontakta</h3>
              <p className="muted">
                Öppna en medlemsprofil för att starta ett privat samtal, eller välj ett befintligt samtal till vänster.
              </p>
            </div>
          )}
        </article>
      </section>
    </BrandPageShell>
  )
}

export default MessagesPage
