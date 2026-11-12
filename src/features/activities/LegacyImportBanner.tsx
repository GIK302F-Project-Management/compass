import { useState } from 'react'
import { useSession } from '@/shared/session/useSession'
import { countLegacyActivities, discardLegacyActivities, importLegacyActivities } from './api/legacyData'
import './LegacyImportBanner.css'

type LegacyImportBannerProps = {
  onImported: () => void // some activities were moved, so the list has to be loaded again
}

// Activities saved in this browser before they were kept on the server: offers to move them into the atlas.
// Shows nothing for an account without old data.
export function LegacyImportBanner({ onImported }: LegacyImportBannerProps) {
  const email = useSession()?.email ?? ''
  const [count, setCount] = useState(() => countLegacyActivities(email))
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')

  if (count === 0 && !notice) return null

  async function handleImport() {
    setWorking(true)
    setNotice('')
    const { imported, failed } = await importLegacyActivities(email)
    setWorking(false)
    setCount(countLegacyActivities(email))
    if (imported > 0) onImported()
    setNotice(
      failed === 0
        ? `Moved ${imported} ${imported === 1 ? 'activity' : 'activities'} into your atlas.`
        : `Moved ${imported}, but ${failed} could not be moved. They stay in this browser; you can add them by hand or discard them.`,
    )
  }

  function handleDiscard() {
    if (!window.confirm('Delete the old activities saved in this browser? This cannot be undone.')) return
    discardLegacyActivities(email)
    setCount(0)
    setNotice('')
  }

  return (
    <section className="legacy-banner" aria-label="Activities saved in this browser">
      {count > 0 && (
        <>
          <p>
            This browser still has <strong>{count}</strong> {count === 1 ? 'activity' : 'activities'} saved only in this
            browser. Move {count === 1 ? 'it' : 'them'} into your atlas?
          </p>
          <div className="legacy-banner-actions">
            <button type="button" className="button button-small" onClick={handleImport} disabled={working}>
              {working ? 'Moving...' : 'Move them here'}
            </button>
            <button
              type="button"
              className="button button-small button-danger"
              onClick={handleDiscard}
              disabled={working}
            >
              Discard
            </button>
          </div>
        </>
      )}
      <p role="status">{notice}</p>
    </section>
  )
}
