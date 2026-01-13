import { LegalDocument } from '../components/legal-document';
import { privacyPolicy } from '../assets/privacy-content';

export function PrivacyPage() {
  return (
    // We override the default centering of the shell here
    <div className="text-left items-start">
      <LegalDocument content={privacyPolicy} />
    </div>
  );
}
