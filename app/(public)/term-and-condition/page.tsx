import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — MindTalk by Cadabams",
  description: "Terms and Conditions for using the Cadabams MindTalk application.",
};

export default function TermsAndConditionsPage() {
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
            <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
          </header>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the Cadabams
              MindTalk application supported by CADABAMS Mental Healthcare Services Pvt. Ltd.
              (&ldquo;App&rdquo;). By using our App, you agree to these Terms. If you do not agree
              to these Terms, please do not use our application.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cadabams MindTalk provides mental health consultations with qualified therapists,
              psychiatrists, and rehabilitation experts. Our services are not intended to replace
              emergency medical care. If you are in a crisis situation, please seek immediate help
              from a healthcare provider.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. User Obligations</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using our application, you agree to provide accurate and complete information about
              yourself and to update this information as necessary. You agree to use our services in
              a manner that complies with all applicable laws and regulations, and you will not use
              our services for any illegal or harmful purpose.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on our application, including text, graphics, logos, images, and software,
              is the property of Cadabams MindTalk or its content suppliers and is protected by
              international copyright laws.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the extent permitted by law, Cadabams MindTalk will not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising out of or in
              connection with these Terms or your use of our services.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any
              changes by posting the new Terms on this page. Changes are effective immediately upon
              posting.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of India where Cadabams MindTalk is based,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:info@cadabams.com" className="text-primary hover:underline">
                info@cadabams.com
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
