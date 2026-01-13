import { termsOfService } from '../assets/tos-content';
import { LegalDocument } from '../components/legal-document';

export default function TermsOfServicePage() {
  return (
    <div className="text-left items-start">
      <LegalDocument content={termsOfService} />
    </div>
  );
}
