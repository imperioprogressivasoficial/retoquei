import { notFound } from 'next/navigation'

// NOTE: The landing page at "/" is handled by src/app/page.tsx
// This file should not be rendered - app/page.tsx takes precedence.
// If somehow this renders, return 404 to avoid duplicate route conflicts.
export default function PublicIndexPage() {
  notFound()
}
