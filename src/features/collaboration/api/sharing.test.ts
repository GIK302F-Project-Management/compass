import { describe, expect, it } from 'vitest'
import { jsonResponse, makeSession, stubFetch } from '@/test/helpers'
import { saveSession } from '@/shared/session/session'
import { ApiError } from '@/shared/api/http'
import {
  acceptInvitation,
  createInvitation,
  invitationLink,
  tokenFromLink,
  listInvitations,
  listMembers,
  previewInvitation,
  removeMember,
  revokeInvitation,
} from './sharing'

const pathOf = (url: unknown) => String(url).replace(/^https?:\/\/[^/]+/, '')

describe('members', () => {
  it('lists the members of an activity, with ids as text, and sends the token', async () => {
    saveSession(makeSession({ token: 'share-token' }))
    const fetchMock = stubFetch(
      jsonResponse([{ userId: 1, name: 'Ana', owner: true, you: true, joinedAt: '2026-11-03T10:00:00Z' }]),
    )

    expect(await listMembers('4')).toEqual([
      { userId: '1', name: 'Ana', owner: true, you: true, joinedAt: '2026-11-03T10:00:00Z' },
    ])
    expect(pathOf(fetchMock.mock.calls[0]![0])).toBe('/activities/4/members')
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Authorization')).toBe('Bearer share-token')
  })

  it('removes a member, or leaves with your own id', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    await removeMember('4', '9')

    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE')
    expect(pathOf(fetchMock.mock.calls[0]![0])).toBe('/activities/4/members/9')
  })
})

describe('invitations', () => {
  const INVITATION = { id: 8, token: 'tok_en-1', createdAt: '2026-11-03T10:00:00Z', expiresAt: '2026-11-10T10:00:00Z' }

  it('creates, lists and revokes the links of an activity', async () => {
    const fetchMock = stubFetch(
      jsonResponse(INVITATION, 201),
      jsonResponse([INVITATION]),
      new Response(null, { status: 204 }),
    )

    expect(await createInvitation('4')).toEqual({ ...INVITATION, id: '8' })
    expect(await listInvitations('4')).toEqual([{ ...INVITATION, id: '8' }])
    await revokeInvitation('4', '8')

    const calls = fetchMock.mock.calls.map(([url, init]) => [init.method ?? 'GET', pathOf(url)])
    expect(calls).toEqual([
      ['POST', '/activities/4/invitations'],
      ['GET', '/activities/4/invitations'],
      ['DELETE', '/activities/4/invitations/8'],
    ])
  })

  it('previews an invitation and accepts it, answering the activity id', async () => {
    const PREVIEW = {
      activityTitle: 'Group project',
      subject: 'Physics',
      dueDate: '2026-12-01',
      ownerName: 'Ana',
      memberCount: 2,
      alreadyMember: false,
    }
    const fetchMock = stubFetch(jsonResponse(PREVIEW), jsonResponse({ id: 7, title: 'Group project' }))

    expect(await previewInvitation('tok_en-1')).toEqual(PREVIEW)
    expect(await acceptInvitation('tok_en-1')).toBe('7')
    expect(pathOf(fetchMock.mock.calls[0]![0])).toBe('/invitations/tok_en-1')
    expect(pathOf(fetchMock.mock.calls[1]![0])).toBe('/invitations/tok_en-1/accept')
    expect(fetchMock.mock.calls[1]![1].method).toBe('POST')
  })

  it('tells an unknown link (404) and a full activity (409) apart', async () => {
    stubFetch(new Response(null, { status: 404 }), new Response(null, { status: 409 }))

    expect(await previewInvitation('nope').catch((e: ApiError) => e.status)).toBe(404)
    expect(await acceptInvitation('full').catch((e: ApiError) => e.status)).toBe(409)
  })

  it('finds the token in a pasted link, or takes a pasted token as it is', () => {
    const token = 'Ab3_dE-fGhIjKlMnOpQrStUvWxYz0123456789abcd'

    expect(tokenFromLink(`  http://localhost:5173/join/${token}  `)).toBe(token)
    expect(tokenFromLink(`https://compass.app/join/${token}?from=mail`)).toBe(token)
    expect(tokenFromLink(token)).toBe(token)
    expect(tokenFromLink('hello')).toBeNull()
    expect(tokenFromLink('https://compass.app/home')).toBeNull()
  })

  it('builds the link to the join page of this app', () => {
    expect(invitationLink('abc')).toBe(`${window.location.origin}/join/abc`)
  })
})
