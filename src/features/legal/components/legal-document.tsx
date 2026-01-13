import ReactMarkdown from 'react-markdown';

interface LegalDocumentProps {
  content: string;
}

export function LegalDocument({ content }: LegalDocumentProps) {
  return (
    <div className="w-full bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <article className="prose prose-slate max-w-none dark:prose prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-a:text-blue-600">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
