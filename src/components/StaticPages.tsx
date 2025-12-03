import { ArrowLeft, Mail, FileText, HelpCircle, Shield, Info, type LucideIcon } from 'lucide-react';

interface StaticPageProps {
  page: string;
  onBack: () => void;
}

const StaticPage = ({ page, onBack }: StaticPageProps) => {
  const content: Record<string, { title: string; icon: LucideIcon; body: React.ReactNode }> = {
    about: {
      title: 'About Us',
      icon: Info,
      body: (
        <div className="space-y-4 text-gray-600">
          <p>
            We are a student-run platform dedicated to connecting students who need errands done with runners who want to earn extra cash.
          </p>
          <p>
            Our mission is to make campus life easier and more efficient for everyone. Whether you're pulling an all-nighter and need food, or you have some free time and want to make money, we're here for you.
          </p>
        </div>
      ),
    },
    contact: {
      title: 'Contact Us',
      icon: Mail,
      body: (
        <div className="space-y-4 text-gray-600">
          <p>Have questions or feedback? Reach out to us!</p>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">Support Team</h3>
            <p className="text-sm">Email: support@runnersapp.com</p>
            <p className="text-sm">Phone: +63 900 000 0000</p>
          </div>
        </div>
      ),
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: HelpCircle,
      body: (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-bold text-gray-900 mb-1">How do I pay?</h3>
            <p className="text-sm text-gray-600">Payments are currently handled directly between the student and the runner via GCash or Cash.</p>
          </div>
          <div className="border-b pb-4">
            <h3 className="font-bold text-gray-900 mb-1">Is it safe?</h3>
            <p className="text-sm text-gray-600">Yes, we verify all our runners with valid IDs to ensure safety and trust.</p>
          </div>
        </div>
      ),
    },
    terms: {
      title: 'Terms & Conditions',
      icon: FileText,
      body: (
        <div className="space-y-4 text-sm text-gray-600">
          <p>By using this app, you agree to our terms of service. Runners are independent contractors and not employees.</p>
          <p>We are not responsible for lost or damaged items, though we facilitate dispute resolution.</p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      body: (
        <div className="space-y-4 text-sm text-gray-600">
          <p>We take your privacy seriously. We collect only the data necessary to provide our services.</p>
          <p>Your location data is only shared during an active job.</p>
        </div>
      ),
    },
    help: {
      title: 'Help Center',
      icon: HelpCircle,
      body: (
        <div className="space-y-4 text-gray-600">
          <p>Need assistance with an order?</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Check your active requests in the "Activity" tab.</li>
            <li>Contact your runner directly if you have an assigned runner.</li>
            <li>Email support for critical issues.</li>
          </ul>
        </div>
      ),
    },
    // We add a default case to handle potential missing pages safely
  };

  const pageData = content[page];

  if (!pageData) return null;

  const Icon = pageData.icon;

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 p-8 border-b border-gray-100 flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600">
            <Icon size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{pageData.title}</h1>
        </div>
        <div className="p-8">
          {pageData.body}
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
