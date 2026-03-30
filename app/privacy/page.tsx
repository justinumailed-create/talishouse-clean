export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-4">
          This Privacy Policy describes how Talishouse Homes & Cottages
          (&ldquo;Talishouse&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;) collects, uses, and shares information about you
          when you use our website and services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">
          INFORMATION WE COLLECT
        </h2>
        <p className="text-gray-600 mb-4">
          We collect information you provide directly to us, such as when you:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
          <li>Fill out a form on our website</li>
          <li>Create an account</li>
          <li>Make a purchase</li>
          <li>Contact us for support</li>
          <li>Subscribe to our newsletter</li>
        </ul>
        <p className="text-gray-600 mb-4">
          This information may include your name, email address, phone number,
          postal address, payment information, and any other information you
          choose to provide.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">
          HOW WE USE YOUR INFORMATION
        </h2>
        <p className="text-gray-600 mb-4">We use the information we collect to:</p>
        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
          <li>Process transactions and send related information</li>
          <li>Send promotional communications (with your consent)</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Monitor and analyze trends, usage, and activities</li>
          <li>Detect, investigate, and prevent fraudulent transactions</li>
          <li>Improve our website and services</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">
          INFORMATION SHARING
        </h2>
        <p className="text-gray-600 mb-4">
          We do not sell, trade, or otherwise transfer your personal information
          to third parties without your consent, except as described in this
          policy. We may share information with:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
          <li>Service providers who assist in our operations</li>
          <li>Payment processors for transaction handling</li>
          <li>Legal authorities when required by law</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">DATA SECURITY</h2>
        <p className="text-gray-600 mb-4">
          We implement appropriate technical and organizational measures to
          protect the security of your personal information. However, no method
          of transmission over the Internet or electronic storage is 100% secure.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">
          YOUR RIGHTS
        </h2>
        <p className="text-gray-600 mb-4">
          Depending on your location, you may have certain rights regarding your
          personal information, including:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
          <li>The right to access your personal information</li>
          <li>The right to correct inaccurate information</li>
          <li>The right to delete your personal information</li>
          <li>The right to object to or restrict processing</li>
          <li>The right to data portability</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">COOKIES</h2>
        <p className="text-gray-600 mb-4">
          We use cookies and similar tracking technologies to track activity on
          our website and hold certain information. You can instruct your browser
          to refuse all cookies or to indicate when a cookie is being sent.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">THIRD-PARTY LINKS</h2>
        <p className="text-gray-600 mb-4">
          Our website may contain links to third-party websites and services
          that are not operated by us. We are not responsible for the privacy
          practices of these third parties.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">
          CHANGES TO THIS POLICY
        </h2>
        <p className="text-gray-600 mb-4">
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy on this page and
          updating the &ldquo;last updated&rdquo; date.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">CONTACT US</h2>
        <p className="text-gray-600 mb-4">
          If you have any questions about this Privacy Policy, please contact us
          at{" "}
          <a
            href="mailto:welcome@talispros.com"
            className="text-blue-600 hover:underline"
          >
            welcome@talispros.com
          </a>
          .
        </p>

        <p className="text-gray-400 text-sm mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <hr className="my-8" />

        <h2 className="text-lg font-semibold mb-2">SMS Privacy Policy</h2>

        <p className="text-sm text-gray-700">
          We collect phone numbers and related information only for the purpose of providing SMS communications related to our services.
        </p>

        <p className="text-sm text-gray-700 mt-2">
          SMS consent and phone numbers will never be shared with third parties or affiliates for marketing purposes.
        </p>

        <p className="text-sm text-gray-700 mt-2">
          Your information is used solely for communication and service delivery, including transactional updates and promotional messages where consent has been provided.
        </p>
      </div>
    </div>
  );
}
