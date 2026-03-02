import Link from 'next/link'

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/" 
            className="text-purple-600 hover:text-purple-700 mb-8 inline-block"
          >
            ← Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: March 2, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using AI Children's Books, you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Use License</h2>
              <p className="text-gray-700 mb-4">
                We grant you a personal, non-transferable, non-exclusive license to use our service 
                for creating children's books. This license is subject to these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Content Ownership and Rights</h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of the books you create using our service. We grant you full 
                commercial rights to the content you generate, including the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Print and distribute your books</li>
                <li>Sell your books commercially</li>
                <li>Use the content for educational purposes</li>
                <li>Modify and adapt the generated content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>
              <p className="text-gray-700 mb-4">
                You agree not to use our service to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Create content that is illegal, harmful, or inappropriate for children</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for any automated or bulk generation without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Payment Terms</h2>
              <p className="text-gray-700 mb-4">
                Certain features of our service require payment. You agree to provide accurate 
                billing information and authorize us to charge your payment method for the services you purchase.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Pay-per-book: $1.99 per book</li>
                <li>Unlimited plan: $29/month, billed monthly</li>
                <li>All prices are in USD</li>
                <li>Refunds are subject to our refund policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Subscription and Cancellation</h2>
              <p className="text-gray-700 mb-4">
                Subscriptions automatically renew unless cancelled. You may cancel your subscription 
                at any time through your account settings. Cancellations take effect at the end of 
                the current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">
                Our service is provided "as is" without warranties of any kind, either express or implied. 
                We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, AI Children's Books shall not be liable for 
                any indirect, incidental, special, consequential, or punitive damages resulting from 
                your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any 
                material changes via email or through the service. Continued use of the service after 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700">
                Email: legal@aichildrensbooks.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
