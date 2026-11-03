import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Every test starts from a clean page and an empty browser storage.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
