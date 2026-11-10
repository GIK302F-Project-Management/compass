import { useEffect } from 'react'

const APP_NAME = 'Compass'

/** Puts the page name in the browser tab ("Goals · Compass"), so tabs and history entries can be told apart. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
    return () => {
      document.title = APP_NAME
    }
  }, [title])
}
