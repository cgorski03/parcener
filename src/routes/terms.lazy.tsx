import { createLazyFileRoute } from '@tanstack/react-router';
import TermsOfServicePage from '@/features/legal/routes/terms-of-service';

export const Route = createLazyFileRoute('/terms')({
  component: TermsOfServicePage,
});
