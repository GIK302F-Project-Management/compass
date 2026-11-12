import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makePlan, renderInPlans } from '@/test/plans'
import { PlanSwitcher } from './PlanSwitcher'

const PERSONAL = makePlan({ id: '1', name: 'My plan' })
const SHARED = makePlan({ id: '2', name: 'Exam group', role: 'MEMBER', memberCount: 3 })

describe('PlanSwitcher', () => {
  it('stays hidden while the student only has their own plan', () => {
    renderInPlans(<PlanSwitcher />, { path: '/home', url: '/home', plans: [PERSONAL] })

    expect(screen.queryByRole('combobox', { name: 'Plan' })).not.toBeInTheDocument()
    expect(screen.queryByText('My plan')).not.toBeInTheDocument()
  })

  it('lets the student switch between their plans', async () => {
    const select = vi.fn()
    renderInPlans(<PlanSwitcher />, { path: '/home', url: '/home', plans: [PERSONAL, SHARED], state: { select } })

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Plan' }), 'Exam group (3)')

    expect(select).toHaveBeenCalledWith('2')
  })
})
