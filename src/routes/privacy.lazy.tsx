import { createLazyFileRoute } from '@tanstack/react-router';
import { PrivacyPage } from '@/features/legal/routes/privacy-policy';

export const Route = createLazyFileRoute('/privacy')({
  component: PrivacyPage,
});
