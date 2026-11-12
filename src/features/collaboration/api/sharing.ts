import { apiJson } from '@/shared/api/http'
import { asList, asObject, readBoolean, readId, readNumber, readString } from '@/shared/api/decode'

// Sharing an activity with classmates, on compass-backend: its members, the invitation links that bring them in,
// and the shape of how its tasks are shared out (see progress.ts). All of these need a login. An activity the student is not in answers 404;
// owner-only actions answer 403 to the other members.

export type Member = {
  userId: string
  name: string // members only see each other's names
  owner: boolean
  you: boolean
  joinedAt: string
}

export type Invitation = {
  id: string
  token: string // goes in the link: /join/<token>
  createdAt: string
  expiresAt: string
}

export type InvitationPreview = {
  activityTitle: string
  subject: string
  dueDate: string // YYYY-MM-DD
  ownerName: string
  memberCount: number
  alreadyMember: boolean
}

export type MemberProgress = {
  userId: string
  name: string
  tasksAssigned: number
  tasksDone: number // of the tasks assigned to them
}

export type ActivityProgress = {
  tasksTotal: number
  tasksDone: number
  tasksUnassigned: number
  percent: number // 0..100, done tasks out of all tasks
  members: MemberProgress[]
}

// GET /activities/<id>/members: who is in the activity, the owner first.
export async function listMembers(activityId: string): Promise<Member[]> {
  return asList(await apiJson(`/activities/${activityId}/members`), 'members', toMember)
}

// DELETE /activities/<id>/members/<userId>: your own id leaves the activity, the owner can remove other members.
// The tasks of whoever leaves stay in the activity, without an assignee.
export async function removeMember(activityId: string, userId: string): Promise<void> {
  await apiJson(`/activities/${activityId}/members/${userId}`, { method: 'DELETE' })
}

// POST /activities/<id>/invitations: owner only. 201 -> a link that works for a week.
export async function createInvitation(activityId: string): Promise<Invitation> {
  return toInvitation(await apiJson(`/activities/${activityId}/invitations`, { method: 'POST' }))
}

// GET /activities/<id>/invitations: owner only. The links that still work, newest first.
export async function listInvitations(activityId: string): Promise<Invitation[]> {
  return asList(await apiJson(`/activities/${activityId}/invitations`), 'invitations', toInvitation)
}

// DELETE /activities/<id>/invitations/<invitationId>: owner only. The link stops working.
export async function revokeInvitation(activityId: string, invitationId: string): Promise<void> {
  await apiJson(`/activities/${activityId}/invitations/${invitationId}`, { method: 'DELETE' })
}

// GET /invitations/<token>: what the link is for, without joining. 404 -> ApiError: unknown, expired or revoked.
export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const body = asObject(await apiJson(`/invitations/${encodeURIComponent(token)}`), 'invitation')
  return {
    activityTitle: readString(body, 'activityTitle'),
    subject: readString(body, 'subject'),
    dueDate: readString(body, 'dueDate'),
    ownerName: readString(body, 'ownerName'),
    memberCount: readNumber(body, 'memberCount'),
    alreadyMember: readBoolean(body, 'alreadyMember'),
  }
}

// POST /invitations/<token>/accept: joins the activity (twice is fine), so it shows up in the atlas.
// Answers with the activity's id. 404 -> not valid, 409 -> the activity is full.
export async function acceptInvitation(token: string): Promise<string> {
  const body = asObject(
    await apiJson(`/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST' }),
    'activity',
  )
  return readId(body, 'id')
}

// The token in what a student pasted: the whole link (".../join/<token>") or just the token. Null when it is neither.
export function tokenFromLink(text: string): string | null {
  const pasted = text.trim()
  const inLink = /\/join\/([A-Za-z0-9_-]+)/.exec(pasted)
  if (inLink) return inLink[1]!
  return /^[A-Za-z0-9_-]{20,}$/.test(pasted) ? pasted : null
}

// The text of an invitation link, to copy and send: it opens the join page of this web app.
export function invitationLink(token: string): string {
  return `${window.location.origin}/join/${token}`
}

function toMember(value: unknown): Member {
  const body = asObject(value, 'member')
  return {
    userId: readId(body, 'userId'),
    name: readString(body, 'name'),
    owner: readBoolean(body, 'owner'),
    you: readBoolean(body, 'you'),
    joinedAt: readString(body, 'joinedAt'),
  }
}

function toInvitation(value: unknown): Invitation {
  const body = asObject(value, 'invitation')
  return {
    id: readId(body, 'id'),
    token: readString(body, 'token'),
    createdAt: readString(body, 'createdAt'),
    expiresAt: readString(body, 'expiresAt'),
  }
}
