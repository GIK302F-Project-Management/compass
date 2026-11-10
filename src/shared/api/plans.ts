import { apiJson } from './http'
import { asList, asObject, readBoolean, readId, readNumber, readString, type JsonObject } from './decode'

// Shared study plans on compass-backend. Activities and tasks live inside a plan, and every member of the plan
// sees and edits them. All of these need a login (apiFetch sends the token). A plan the student is not in
// answers 404, so callers treat 404 as "no such plan"; anything unexpected throws an ApiError.

export type PlanRole = 'OWNER' | 'MEMBER'

export type Plan = {
  id: string
  name: string
  role: PlanRole
  memberCount: number
  createdAt: string // ISO timestamp
}

export type PlanMember = {
  userId: string
  name: string // members only see each other's names
  owner: boolean
  you: boolean
  joinedAt: string
}

export type PlanDetails = {
  id: string
  name: string
  role: PlanRole
  createdAt: string
  members: PlanMember[] // the owner first
}

export type Invitation = {
  id: string
  token: string // goes in the link: /join/<token>
  createdAt: string
  expiresAt: string
}

export type InvitationPreview = {
  planName: string
  ownerName: string
  memberCount: number
  alreadyMember: boolean
}

export type MemberProgress = {
  userId: string
  name: string
  tasksDone: number
  activitiesDone: number
}

export type PlanProgress = {
  activitiesTotal: number
  activitiesDone: number
  tasksTotal: number
  tasksDone: number
  percent: number // 0..100, every task (and every activity without tasks) counts as one step
  members: MemberProgress[]
}

// GET /plans: the plans the student is in. A student with none gets a personal plan ("My plan") first.
export async function listPlans(): Promise<Plan[]> {
  return asList(await apiJson('/plans'), 'plans', toPlan)
}

// POST /plans: 201 -> the new plan, owned by the student. 400 -> ApiError with fieldErrors.name.
export async function createPlan(name: string): Promise<Plan> {
  return toPlan(await apiJson('/plans', { method: 'POST', body: { name: name.trim() } }))
}

// GET /plans/<id>: the plan with its members.
export async function getPlan(id: string): Promise<PlanDetails> {
  const body = asObject(await apiJson(`/plans/${id}`), 'plan')
  return {
    id: readId(body, 'id'),
    name: readString(body, 'name'),
    role: toRole(body),
    createdAt: readString(body, 'createdAt'),
    members: asList(body.members, 'members', toMember),
  }
}

// PUT /plans/<id>: owner only (403 for members). 400 -> ApiError with fieldErrors.name.
export async function renamePlan(id: string, name: string): Promise<Plan> {
  return toPlan(await apiJson(`/plans/${id}`, { method: 'PUT', body: { name: name.trim() } }))
}

// DELETE /plans/<id>: owner only. Removes the plan with its activities and tasks.
export async function deletePlan(id: string): Promise<void> {
  await apiJson(`/plans/${id}`, { method: 'DELETE' })
}

// DELETE /plans/<id>/members/<userId>: your own id leaves the plan, the owner can remove other members.
export async function removeMember(planId: string, userId: string): Promise<void> {
  await apiJson(`/plans/${planId}/members/${userId}`, { method: 'DELETE' })
}

// GET /plans/<id>/progress: how much of the plan is done, and what each member completed.
export async function getPlanProgress(planId: string): Promise<PlanProgress> {
  const body = asObject(await apiJson(`/plans/${planId}/progress`), 'progress')
  return {
    activitiesTotal: readNumber(body, 'activitiesTotal'),
    activitiesDone: readNumber(body, 'activitiesDone'),
    tasksTotal: readNumber(body, 'tasksTotal'),
    tasksDone: readNumber(body, 'tasksDone'),
    percent: readNumber(body, 'percent'),
    members: asList(body.members, 'members', (item) => {
      const member = asObject(item, 'member progress')
      return {
        userId: readId(member, 'userId'),
        name: readString(member, 'name'),
        tasksDone: readNumber(member, 'tasksDone'),
        activitiesDone: readNumber(member, 'activitiesDone'),
      }
    }),
  }
}

// POST /plans/<id>/invitations: owner only. 201 -> a link that works for a week.
export async function createInvitation(planId: string): Promise<Invitation> {
  return toInvitation(await apiJson(`/plans/${planId}/invitations`, { method: 'POST' }))
}

// GET /plans/<id>/invitations: owner only. The links that still work, newest first.
export async function listInvitations(planId: string): Promise<Invitation[]> {
  return asList(await apiJson(`/plans/${planId}/invitations`), 'invitations', toInvitation)
}

// DELETE /plans/<id>/invitations/<invitationId>: owner only. The link stops working.
export async function revokeInvitation(planId: string, invitationId: string): Promise<void> {
  await apiJson(`/plans/${planId}/invitations/${invitationId}`, { method: 'DELETE' })
}

// GET /invitations/<token>: what the link is for, without joining. 404 -> ApiError: unknown, expired or revoked.
export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const body = asObject(await apiJson(`/invitations/${encodeURIComponent(token)}`), 'invitation')
  return {
    planName: readString(body, 'planName'),
    ownerName: readString(body, 'ownerName'),
    memberCount: readNumber(body, 'memberCount'),
    alreadyMember: readBoolean(body, 'alreadyMember'),
  }
}

// POST /invitations/<token>/accept: joins the plan (twice is fine). 404 -> not valid, 409 -> the plan is full.
export async function acceptInvitation(token: string): Promise<Plan> {
  return toPlan(await apiJson(`/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST' }))
}

// The text of an invitation link, to copy and send: it opens the join page of this web app.
export function invitationLink(token: string): string {
  return `${window.location.origin}/join/${token}`
}

function toRole(body: JsonObject): PlanRole {
  const role = readString(body, 'role')
  if (role !== 'OWNER' && role !== 'MEMBER') throw new Error('Unexpected response: unknown role')
  return role
}

function toPlan(value: unknown): Plan {
  const body = asObject(value, 'plan')
  return {
    id: readId(body, 'id'),
    name: readString(body, 'name'),
    role: toRole(body),
    memberCount: readNumber(body, 'memberCount'),
    createdAt: readString(body, 'createdAt'),
  }
}

function toMember(value: unknown): PlanMember {
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
