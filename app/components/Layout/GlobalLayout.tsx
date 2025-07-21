import { useLocation } from '@remix-run/react';
import AppLayout from './AppLayout';

interface GlobalLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  } | null;
}

// Pages that should NOT have the sidebar
const NO_SIDEBAR_PAGES = [
  '/login',
  '/register',
  '/onboarding',
  '/auth',
  '/', // landing page
];

export default function GlobalLayout({ children, user }: GlobalLayoutProps) {
  const location = useLocation();
  
  // Check if current page should have sidebar
  const shouldShowSidebar = user && !NO_SIDEBAR_PAGES.some(page => 
    location.pathname === page || location.pathname.startsWith(page + '/')
  );

  if (shouldShowSidebar) {
    return (
      <AppLayout user={user}>
        {children}
      </AppLayout>
    );
  }

  return <>{children}</>;
}