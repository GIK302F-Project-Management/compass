import { describe, expect, it } from 'vitest'
import { jsonResponse, makeSession, sentBody, stubFetch } from '@/test/helpers'
import { saveSession } from '@/shared/session/session'
import { ApiError } from './http'
import {
  acceptInvitation,
  createInvitation,
  createPlan,
  deletePlan,
  getPlan,
  getPlanProgress,
  invitationLink,
  listInvitations,
  listPlans,
  previewInvitation,
  removeMember,
  renamePlan,
  revokeInvitation,
} from './plans'

const PLAN = { id: 4, name: 'Exam group', role: 'OWNER', memberCount: 2, createdAt: '2026-11-03T10:00:00Z' }
const PLAN_TEXT = { ...PLAN, id: '4' }

describe('plans', () => {
  it('lists the plans, with ids as text, and sends the token', async () => {
    saveSession(makeSession({ token: 'plan-token' }))
    const fetchMock = stubFetch(jsonResponse([PLAN]))

    expect(await listPlans()).toEqual([PLAN_TEXT])
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/plans$/)
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Authorization')).toBe('Bearer plan-token')
  })

  it('refuses a plan with an unknown role', async () => {
    stubFetch(jsonResponse([{ ...PLAN, role: 'BOSS' }]))
    await expect(listPlans()).rejects.toThrow(/unknown role/)
  })

  it('creates a plan with the trimmed name', async () => {
    const fetchMock = stubFetch(jsonResponse(PLAN, 201))

    expect(await createPlan('  Exam group ')).toEqual(PLAN_TEXT)
    expect(fetchMock.mock.calls[0]![1].method).toBe('POST')
    expect(sentBody(fetchMock)).toEqual({ name: 'Exam group' })
  })

  it('reports the messages of a refused name', async () => {
    stubFetch(jsonResponse({ errors: { name: 'Please give the plan a name.' } }, 400))

    const error = await createPlan('').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).fieldErrors).toEqual({ name: 'Please give the plan a name.' })
  })

  it('reads a plan with its members', async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        ...PLAN,
        members: [{ userId: 1, name: 'Ana', owner: true, you: true, joinedAt: '2026-11-03T10:00:00Z' }],
      }),
    )

    const plan = await getPlan('4')

    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/plans\/4$/)
    expect(plan.members).toEqual([
      { userId: '1', name: 'Ana', owner: true, you: true, joinedAt: '2026-11-03T10:00:00Z' },
    ])
  })

  it('renames, deletes and removes members with the right requests', async () => {
    const fetchMock = stubFetch(
      jsonResponse(PLAN),
      new Response(null, { status: 204 }),
      new Response(null, { status: 204 }),
    )

    await renamePlan('4', ' New name ')
    await deletePlan('4')
    await removeMember('4', '9')

    const calls = fetchMock.mock.calls.map(([url, init]) => [init.method, String(url).replace(/^.*\/plans/, '/plans')])
    expect(calls).toEqual([
      ['PUT', '/plans/4'],
      ['DELETE', '/plans/4'],
      ['DELETE', '/plans/4/members/9'],
    ])
    expect(sentBody(fetchMock)).toEqual({ name: 'New name' })
  })

  it('reads the progress of a plan', async () => {
    stubFetch(
      jsonResponse({
        activitiesTotal: 2,
        activitiesDone: 1,
        tasksTotal: 4,
        tasksDone: 3,
        percent: 75,
        members: [{ userId: 1, name: 'Ana', tasksDone: 3, activitiesDone: 1 }],
      }),
    )

    expect(await getPlanProgress('4')).toEqual({
      activitiesTotal: 2,
      activitiesDone: 1,
      tasksTotal: 4,
      tasksDone: 3,
      percent: 75,
      members: [{ userId: '1', name: 'Ana', tasksDone: 3, activitiesDone: 1 }],
    })
  })
})

describe('invitations', () => {
  const INVITATION = { id: 8, token: 'tok_en-1', createdAt: '2026-11-03T10:00:00Z', expiresAt: '2026-11-10T10:00:00Z' }

  it('creates, lists and revokes the links of a plan', async () => {
    const fetchMock = stubFetch(
      jsonResponse(INVITATION, 201),
      jsonResponse([INVITATION]),
      new Response(null, { status: 204 }),
    )

    expect(await createInvitation('4')).toEqual({ ...INVITATION, id: '8' })
    expect(await listInvitations('4')).toEqual([{ ...INVITATION, id: '8' }])
    await revokeInvitation('4', '8')

    const calls = fetchMock.mock.calls.map(([url, init]) => [
      init.method ?? 'GET',
      String(url).replace(/^.*\/plans/, '/plans'),
    ])
    expect(calls).toEqual([
      ['POST', '/plans/4/invitations'],
      ['GET', '/plans/4/invitations'],
      ['DELETE', '/plans/4/invitations/8'],
    ])
  })

  it('previews and accepts an invitation by its token', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ planName: 'Exam group', ownerName: 'Ana', memberCount: 2, alreadyMember: false }),
      jsonResponse(PLAN),
    )

    expect(await previewInvitation('tok_en-1')).toEqual({
      planName: 'Exam group',
      ownerName: 'Ana',
      memberCount: 2,
      alreadyMember: false,
    })
    expect(await acceptInvitation('tok_en-1')).toEqual(PLAN_TEXT)
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/\/invitations\/tok_en-1$/)
    expect(String(fetchMock.mock.calls[1]![0])).toMatch(/\/invitations\/tok_en-1\/accept$/)
    expect(fetchMock.mock.calls[1]![1].method).toBe('POST')
  })

  it('tells an unknown link (404) and a full plan (409) apart', async () => {
    stubFetch(new Response(null, { status: 404 }), new Response(null, { status: 409 }))

    expect(await previewInvitation('nope').catch((e: ApiError) => e.status)).toBe(404)
    expect(await acceptInvitation('full').catch((e: ApiError) => e.status)).toBe(409)
  })

  it('builds the link to the join page of this app', () => {
    expect(invitationLink('abc')).toBe(`${window.location.origin}/join/abc`)
  })
})
