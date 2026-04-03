import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — MindTalk by Cadabams',
  description: 'How Cadabams Consult collects, uses, and protects your personal data.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background" role="main">
      <div className="container mx-auto max-w-2xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          aria-label="Back to home"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground italic mt-2">
              Last Updated: January 23, 2024
            </p>
          </header>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cadabams Consult supported by Cadabam Hospitals Enterprises Private Limited
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy and
              is committed to protecting your personal data. This privacy policy will inform you
              about how we look after your personal data when you use our application (&ldquo;App&rdquo;)
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. The Data We Collect About You</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may collect, use, store, and transfer different kinds of personal data about you
              which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Identity Data includes first name, last name, and gender.</li>
              <li>Contact Data includes email address and telephone numbers.</li>
              <li>
                Health Data includes information related to your health, treatment history, and
                other health-related information that is necessary for us to provide our services.
              </li>
            </ul>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Personal Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              We will only use your personal data when the law allows us to. Most commonly, we will
              use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>To register you as a new customer.</li>
              <li>To provide you with our services.</li>
              <li>To manage our relationship with you.</li>
            </ul>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We have put in place appropriate security measures to prevent your personal data from
              being accidentally lost, used, or accessed in an unauthorised way, altered, or
              disclosed. In addition, we limit access to your personal data to those employees,
              agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We will only retain your personal data for as long as necessary to fulfil the
              purposes we collected it for, including for the purposes of satisfying any legal,
              accounting, or reporting requirements.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Your Legal Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under certain circumstances, you have rights under data protection laws in relation
              to your personal data. These include the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Request access to your personal data.</li>
              <li>Request correction of your personal data.</li>
              <li>Request erasure of your personal data.</li>
              <li>Object to the processing of your personal data.</li>
              <li>Request restriction of processing your personal data.</li>
              <li>Request transfer of your personal data.</li>
              <li>Right to withdraw consent.</li>
            </ul>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              7. Changes to the Privacy Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This version was last updated on January 23, 2024. It may change and if it does,
              these changes will be posted on this page and, where appropriate, notified to you.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Contact Details</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or our privacy practices, please
              contact us at{' '}
              <a
                href="mailto:info@cadabams.org"
                className="text-primary hover:underline"
              >
                info@cadabams.org
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
