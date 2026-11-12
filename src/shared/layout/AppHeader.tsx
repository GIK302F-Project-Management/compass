import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { MainNav } from './MainNav'
import { TopBar } from './TopBar'
import { UserMenu } from './UserMenu'

type AppHeaderProps = {
  title: string
}

// The header of every page behind the login: same logos, same navigation, same user menu.
export function AppHeader({ title }: AppHeaderProps) {
  useDocumentTitle(title)

  return (
    <>
      <TopBar title={title} actions={<UserMenu />} />
      <MainNav />
    </>
  )
}
