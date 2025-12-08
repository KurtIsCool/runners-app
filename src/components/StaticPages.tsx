import { ArrowLeft, Mail, FileText, HelpCircle, Shield, Info, Phone, Facebook, type LucideIcon } from 'lucide-react';
import React from 'react';

// Export the content so it can be used elsewhere
export const staticContent: Record<string, { title: string; icon: LucideIcon; body: React.ReactNode }> = {
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
        <div className="space-y-6 text-gray-600">
          <p>Have questions or feedback? Reach out to us!</p>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <h3 className="font-bold text-blue-900 mb-2">Support Team</h3>

            <a href="mailto:Runners@gmail.com" className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <Mail size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase">Email</div>
                <div className="font-medium text-gray-900">Runners@gmail.com</div>
              </div>
            </a>

            <a href="tel:09852885959" className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <Phone size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase">Phone</div>
                <div className="font-medium text-gray-900">09852885959</div>
              </div>
            </a>

            <a href="https://www.facebook.com/D-Runners" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <Facebook size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase">Facebook Page</div>
                <div className="font-medium text-gray-900">D' Runners</div>
              </div>
            </a>

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
        <div className="space-y-6 text-sm text-gray-600">
          <div>
            <p className="font-bold text-gray-900">Last Updated: December 09, 2025</p>
          </div>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">1. INTRODUCTION</h3>
            <p>Welcome to Runners ("we," "us," or "our"). These Terms and Conditions ("Terms") govern your access to and use of the Runners mobile and web application (the "Platform"). By creating an account, accessing, or using the Platform, you agree to be bound by these Terms.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">2. DEFINITIONS</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>"Platform"</strong> refers to the Runners web/mobile application.</li>
              <li><strong>"Requestor"</strong> refers to a verified student currently enrolled in an educational institution who posts an errand request.</li>
              <li><strong>"Runner"</strong> refers to the individual who accepts and fulfills the errand request.</li>
              <li><strong>"Service"</strong> refers to the errands, deliveries, and tasks facilitated through the Platform.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">3. ELIGIBILITY & VERIFICATION</h3>
            <div className="space-y-2">
              <p><strong>Student Status:</strong> To register as a Requestor, you must be a currently enrolled student. We reserve the right to verify your status via your School ID (e.g., CPU, UPV, WVSU, USA, ISAT-U, etc.) or proof of enrollment.</p>
              <p><strong>Age:</strong> You must be at least 18 years old. If you are a minor (under 18), you verify that you have parental consent to use this service.</p>
              <p><strong>Account Security:</strong> You are responsible for keeping your login credentials secure.</p>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">4. SCOPE OF SERVICES</h3>
            <p className="mb-2">Runners connects Student Requestors with Runners for on-demand tasks.</p>

            <p className="font-semibold mt-2">Authorized Errands:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li><strong>Food/Grocery Delivery:</strong> Buying meals or supplies.</li>
              <li><strong>Pasa-buy:</strong> Buying school materials, printing services, etc.</li>
              <li><strong>Courier:</strong> Delivering items between campuses or boarding houses.</li>
            </ul>

            <p className="font-semibold mt-2">Prohibited Acts:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Academic Dishonesty:</strong> You may NOT use Runners to take exams, submit attendance proxies, or turn in thesis papers/projects where personal appearance is required.</li>
              <li><strong>Illegal Items:</strong> No drugs, alcohol (if prohibited in dorms), weapons, or stolen goods.</li>
              <li><strong>Dormitory Rules:</strong> Deliveries to dorms must follow the specific visitor rules of that building (e.g., meet at the lobby only).</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">5. FEES AND PAYMENTS</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Service Fee:</strong> The fee is calculated based on distance and task complexity. This must be agreed upon before the task begins.</li>
              <li><strong>Reimbursement:</strong> The Requestor must pay the full cost of any items purchased by the Runner (e.g., food cost, printing fee).</li>
              <li><strong>Payment Methods:</strong> We currently accept only: Cash on Delivery (COD), GCash.</li>
              <li><strong>Direct Payment:</strong> Unless otherwise specified in the app, payments are made directly between the Requestor and the Runner upon completion of the task.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">6. CANCELLATION POLICY</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>No Cancellation Fee:</strong> We understand that student schedules change. There is no monetary fee for cancelling a request.</li>
              <li><strong>Fair Use:</strong> While there is no fee, we ask that you cancel before the Runner has purchased items or traveled significant distance.</li>
              <li><strong>Abuse Policy:</strong> Frequent cancellations (e.g., cancelling after the Runner has already bought the food) are monitored. Accounts that habitually abuse the "No Cancellation Fee" policy to inconvenience Runners may be temporarily suspended or permanently banned to protect our community.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">7. USER CONDUCT</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Respect:</strong> We are a student community. Abuse, harassment, or rudeness toward Runners is strictly prohibited.</li>
              <li><strong>Responsibility:</strong> Requestors must be reachable via the app or phone when the Runner arrives. If a Requestor is unresponsive for more than 15 minutes upon arrival, the Runner reserves the right to leave, and the incident will be recorded against the Requestor’s account.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">8. LIMITATION OF LIABILITY</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Service Only:</strong> We connect you with a Runner. We are not responsible for the quality of food prepared by restaurants or the availability of items in stores.</li>
              <li><strong>Loss/Damage:</strong> The Platform is not liable for items lost or damaged during transit beyond the value of the Service Fee. Please do not send expensive electronics or large amounts of cash.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">9. DATA PRIVACY</h3>
            <p>We collect your name, student details, and contact info solely to facilitate the delivery.</p>
            <p>We operate in compliance with the Data Privacy Act of 2012 (R.A. 10173). Your data is shared only with the assigned Runner for the duration of the task.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">10. GOVERNING LAW</h3>
            <p>These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved amicably within the Platform first.</p>
          </section>
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
            <li>For general inquiries, visit our <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'contact' }))} className="text-blue-600 font-bold hover:underline">Contact Page</button>.</li>
          </ul>
        </div>
      ),
    },
};

interface StaticPageProps {
  page: string;
  onBack: () => void;
}

const StaticPage = ({ page, onBack }: StaticPageProps) => {
  const pageData = staticContent[page];

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
