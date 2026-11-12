import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession } from '@/shared/session/session'
import { makeSession } from '@/test/helpers'
import * as legacy from './api/legacyData'
import { LegacyImportBanner } from './LegacyImportBanner'

vi.mock('./api/legacyData', () => ({
  countLegacyActivities: vi.fn(),
  importLegacyActivities: vi.fn(),
  discardLegacyActivities: vi.fn(),
}))

const countLegacyActivities = vi.mocked(legacy.countLegacyActivities)
const importLegacyActivities = vi.mocked(legacy.importLegacyActivities)
const discardLegacyActivities = vi.mocked(legacy.discardLegacyActivities)

function renderBanner(onImported = vi.fn()) {
  render(<LegacyImportBanner onImported={onImported} />)
  return onImported
}

beforeEach(() => {
  vi.resetAllMocks()
  saveSession(makeSession({ email: 'ana@alumni.mondragon.edu' }))
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('LegacyImportBanner', () => {
  it('shows nothing when there is no old data', () => {
    countLegacyActivities.mockReturnValue(0)
    renderBanner()

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('moves the activities into the atlas and tells the list to reload', async () => {
    countLegacyActivities.mockReturnValueOnce(2).mockReturnValue(0)
    importLegacyActivities.mockResolvedValue({ imported: 2, failed: 0 })
    const onImported = renderBanner()

    await userEvent.click(screen.getByRole('button', { name: 'Move them here' }))

    expect(importLegacyActivities).toHaveBeenCalledWith('ana@alumni.mondragon.edu')
    expect(await screen.findByText('Moved 2 activities into your atlas.')).toBeInTheDocument()
    expect(onImported).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Move them here' })).not.toBeInTheDocument()
  })

  it('says how many could not be moved and keeps the offer', async () => {
    countLegacyActivities.mockReturnValueOnce(2).mockReturnValue(1)
    importLegacyActivities.mockResolvedValue({ imported: 1, failed: 1 })
    renderBanner()

    await userEvent.click(screen.getByRole('button', { name: 'Move them here' }))

    expect(await screen.findByText(/Moved 1, but 1 could not be moved/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move them here' })).toBeEnabled()
  })

  it('discards the old data after asking', async () => {
    countLegacyActivities.mockReturnValue(1)
    renderBanner()

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

    expect(discardLegacyActivities).toHaveBeenCalledWith('ana@alumni.mondragon.edu')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument())
  })

  it('keeps the data when the student does not confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    countLegacyActivities.mockReturnValue(1)
    renderBanner()

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

    expect(discardLegacyActivities).not.toHaveBeenCalled()
  })
})
