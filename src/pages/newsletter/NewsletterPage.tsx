import { Layout } from '@/components/layout/Layout';
import { NewsletterSignupForm } from '@/components/newsletter/NewsletterSignupForm';

const NewsletterPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Stay Connected with Jacksonville
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get the latest news, events, and community updates delivered straight to your inbox. 
            Choose what matters most to you.
          </p>
        </div>

        {/* Signup Form */}
        <NewsletterSignupForm variant="full" source="newsletter_page" />

        {/* Benefits */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📰</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Daily Digest</h3>
            <p className="text-sm text-slate-600">
              Start your morning with a curated summary of Jacksonville's top stories
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Weekly Highlights</h3>
            <p className="text-sm text-slate-600">
              Weekend recap of the most important news and upcoming events
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Breaking Alerts</h3>
            <p className="text-sm text-slate-600">
              Instant notifications for major stories that matter to you
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewsletterPage;
