import Link from 'next/link'
import { Sparkles, Users, BookOpen, Zap, Download, DollarSign, Check } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Professional Children's Books with AI in Minutes
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Empower parents, educators, and creators to craft personalized, beautifully illustrated stories—no writing or design skills required.
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Professional PDF + Audiobook • 2-3 minutes • Starting at $1.99/book
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:opacity-90 font-semibold text-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
            >
              Start Creating Free
            </Link>
            <Link
              href="#demo"
              className="bg-white text-gray-800 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg border-2 border-gray-200 transition-all w-full sm:w-auto"
            >
              See Example Book
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Free trial available</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Everything You Need to Create Amazing Stories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Story Generation</h3>
              <p className="text-gray-600">
                Age-appropriate, engaging stories crafted by advanced AI trained on children's literature.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Character Consistency</h3>
              <p className="text-gray-600">
                Same characters throughout your entire book—no jarring style changes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Professional Output</h3>
              <p className="text-gray-600">
                Print-ready PDFs and engaging audiobooks narrated with natural AI voices.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast & Affordable</h3>
              <p className="text-gray-600">
                Complete books in 2-3 minutes for as low as $1.99—no expensive illustrators needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Create Your Book in 3 Simple Steps
            </h2>
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Enter Your Story Idea</h3>
                  <p className="text-gray-600 text-lg">
                    Tell us about your story—the theme, characters, or lesson. Our AI handles the rest.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">AI Generates Your Story</h3>
                  <p className="text-gray-600 text-lg">
                    Watch as your book comes to life with beautiful illustrations and a captivating narrative.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Download & Share</h3>
                  <p className="text-gray-600 text-lg">
                    Get your professional PDF and audiobook instantly. Print it, share it, or enjoy it together.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Choose the plan that works for you
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pay Per Book */}
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:border-purple-300 transition-all">
              <h3 className="text-2xl font-bold mb-2">Pay Per Book</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$1.99</span>
                <span className="text-gray-600">/book</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Full PDF + Audiobook</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Unlimited revisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Commercial rights included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">No subscription needed</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Unlimited Plan */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-xl shadow-lg text-white relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold mb-2">Unlimited</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-purple-100">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Unlimited books per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>All features included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Priority generation queue</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Early access to new features</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 font-semibold transition-all shadow-md"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              See the Magic in Action
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Here's an example of what you can create in just minutes
            </p>
            <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center p-8">
                  <p className="text-white font-bold text-3xl mb-3">
                    📚 Sample Book Preview
                  </p>
                  <p className="text-white text-lg font-medium">
                    Coming Soon
                  </p>
                  <p className="text-white/90 text-sm mt-2">
                    Real book examples will be displayed here
                  </p>
                </div>
              </div>
              <div className="text-left space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>12 beautifully illustrated pages</span>
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Professional PDF for printing</span>
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Engaging audiobook narration</span>
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Generated in under 3 minutes</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Bring Your Stories to Life?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Start creating magical stories today
            </p>
            <Link
              href="/signup"
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Your Free Trial
            </Link>
            <p className="text-sm text-purple-100 mt-4">
              No credit card required • Cancel anytime • 7-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">AI Children's Books</h3>
              <p className="text-sm">
                Create professional children's books with AI in minutes.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#demo" className="hover:text-white transition-colors">Examples</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 AI Children's Books. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
