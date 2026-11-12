import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { RouteNotice } from './RouteNotice'

function renderNotice(props: Parameters<typeof RouteNotice>[0]) {
  return render(
    <MemoryRouter>
      <RouteNotice {...props} />
    </MemoryRouter>,
  )
}

describe('RouteNotice', () => {
  it('invites the student to plot a route when there is none', () => {
    renderNotice({ status: 'none', onRetry: vi.fn(), variant: 'trail' })

    expect(screen.getByText('You don’t have a route yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plot my route' })).toHaveAttribute('href', '/planner?new=1')
  })

  it('offers to try again when the route could not be loaded', async () => {
    const onRetry = vi.fn()
    renderNotice({ status: 'failed', onRetry, variant: 'card' })

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your route.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('keeps the side column while loading, but shows nothing above the atlas on small screens', () => {
    const { rerender } = renderNotice({ status: 'loading', onRetry: vi.fn(), variant: 'trail' })
    expect(screen.getByText('Loading your route…')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <RouteNotice status="loading" onRetry={vi.fn()} variant="card" />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Loading your route…')).not.toBeInTheDocument()
  })
})
