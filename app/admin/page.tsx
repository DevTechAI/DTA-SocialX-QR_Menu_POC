import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen gradient-soft">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-block gradient-primary rounded-3xl shadow-soft-xl p-8 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'cursive' }}>
                  SocialX
                </h1>
                <p className="text-lg text-white/90 italic" style={{ fontFamily: 'Georgia, serif' }}>
                  Community Café
                </p>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            QR Menu POC
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A modern, mobile-responsive order management system for cafés and restaurants
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Customer Portal Card */}
          <Link href="/" className="group">
            <div className="card-theme hover:shadow-card-hover transition-all transform hover:scale-105 h-full p-8">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-soft-lg transition-all">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Customer Portal
              </h3>
              <p className="text-gray-600 mb-4">
                Mobile-optimized ordering experience. Scan QR code, browse menu, and place orders.
              </p>
              <div className="flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all">
                <span>Start Ordering</span>
                <span className="ml-2 group-hover:ml-0 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* Manager Dashboard Card */}
          <Link href="/manager" className="group">
            <div className="card-theme hover:shadow-card-hover transition-all transform hover:scale-105 h-full p-8">
              <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center mb-4 group-hover:shadow-soft-lg transition-all">
                <span className="text-4xl">💼</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Manager Dashboard
              </h3>
              <p className="text-gray-600 mb-4">
                Desktop-optimized order management. Track orders, update status, and view analytics.
              </p>
              <div className="flex items-center text-accent-600 font-semibold group-hover:gap-2 transition-all">
                <span>Open Dashboard</span>
                <span className="ml-2 group-hover:ml-0 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features List */}
        <div className="card-theme p-8 mb-8 shadow-soft-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">✨</span>
            <span>Features</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📸</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">QR Code Integration</h4>
                <p className="text-sm text-gray-600">Instant menu access via QR scan</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Real-time Dashboard</h4>
                <p className="text-sm text-gray-600">Live order tracking and analytics</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎨</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Modern UI</h4>
                <p className="text-sm text-gray-600">Clean, intuitive interface</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Mobile-First</h4>
                <p className="text-sm text-gray-600">Optimized for all devices</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🔄</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Status Tracking</h4>
                <p className="text-sm text-gray-600">Color-coded order workflow</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💾</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Supabase Backend</h4>
                <p className="text-sm text-gray-600">Reliable cloud database</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="gradient-soft rounded-3xl p-8 mb-8 shadow-soft">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-3xl">🚀</span>
            <span>Quick Start</span>
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl gradient-primary text-white font-bold flex-shrink-0">1</span>
              <span>Set up Supabase database (see <code className="bg-white px-2 py-1 rounded-lg text-sm font-mono text-primary-600">supabase/README.md</code>)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl gradient-primary text-white font-bold flex-shrink-0">2</span>
              <span>Configure environment variables in <code className="bg-white px-2 py-1 rounded-lg text-sm font-mono text-primary-600">.env.local</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl gradient-primary text-white font-bold flex-shrink-0">3</span>
              <span>Generate QR codes pointing to <code className="bg-white px-2 py-1 rounded-lg text-sm font-mono text-primary-600">/</code> (root URL)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl gradient-primary text-white font-bold flex-shrink-0">4</span>
              <span>Place on tables and start taking orders!</span>
            </li>
          </ol>
        </div>

        {/* Documentation Links */}
        <div className="card-theme p-8 shadow-soft-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span>Documentation</span>
          </h3>
          <div className="space-y-3">
            <a href="/SETUP_GUIDE.md" className="block text-primary-600 hover:text-primary-700 hover:underline font-medium flex items-center gap-2">
              <span>→</span>
              <span>Complete Setup Guide</span>
            </a>
            <a href="/PROJECT_STRUCTURE.md" className="block text-primary-600 hover:text-primary-700 hover:underline font-medium flex items-center gap-2">
              <span>→</span>
              <span>Project Structure</span>
            </a>
            <a href="/supabase/README.md" className="block text-primary-600 hover:text-primary-700 hover:underline font-medium flex items-center gap-2">
              <span>→</span>
              <span>Supabase Configuration</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 py-6">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <a
              href="https://www.devtechai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-semibold underline"
            >
              DevTechAi.Org
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
