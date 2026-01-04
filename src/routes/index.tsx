import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/features/landing/routes'

export const Route = createFileRoute('/')({
    component: LandingPage,
})
