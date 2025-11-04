'use client';

import { useState, useEffect } from 'react';

export default function OrderLandingPage() {
  const [customerName, setCustomerName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      localStorage.setItem('customerName', customerName.trim());
      window.location.href = '/order/menu';
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen gradient-soft flex flex-col">
      {/* Content Container - Mobile focused */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* SocialX Logo Card with Café Background */}
          <div className="mb-8 rounded-3xl overflow-hidden shadow-soft-xl transform hover:scale-105 transition-all duration-300">
            <div className="relative w-full h-64 p-8" style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.75) 0%, rgba(99, 102, 241, 0.75) 100%)',
            }}>
              {/* Café Background Vector - Fitted to this window */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(/background_vector.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: 0.35,
                }}
              />
              
                      {/* Content Layer - Positioned above screen midline */}
                      <div className="absolute inset-0 flex items-center justify-center transform -translate-y-20">
                        <div className="text-center relative z-10">
                  {/* Coffee Cup Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/40 backdrop-blur-md mb-4 mt-20 shadow-soft-lg">
                    <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {/* Coffee cup body */}
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9v8c0 1.657 1.343 3 3 3h8c1.657 0 3-1.343 3-3v-2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9h1a3 3 0 013 3v1a3 3 0 01-3 3h-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h12V7c0-1.105-.895-2-2-2H7c-1.105 0-2 .895-2 2v2z" />
                      {/* Steam lines */}
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 5V3" opacity="0.7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5V2" opacity="0.7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 5V3" opacity="0.7" />
                    </svg>
                  </div>
                  
                          {/* Brand Name */}
                          <h1 className="text-5xl font-bold text-white drop-shadow-2xl mb-3" style={{ fontFamily: 'cursive' }}>
                            SocialX
                          </h1>
                          <p className="text-2xl text-white/95 italic font-medium drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                            Community Café
                          </p>
                </div>
              </div>
              
              {/* Decorative circles with animation */}
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>

          {/* Welcome Card - Elegant Glass-morphism Design */}
          <div className="relative group">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 gradient-primary rounded-[28px] opacity-75 group-hover:opacity-100 blur-sm transition duration-500"></div>
            
            {/* Main card */}
            <div className="relative rounded-3xl overflow-hidden shadow-soft-xl transform hover:scale-[1.02] transition-all duration-500">
              {/* Glass-morphism background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Content */}
              <div className="relative z-10 p-10">
                {/* Welcome Header */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text">
                    Welcome!
                  </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input with elite styling */}
                  <div>
                    <div className="relative group/input">
                      {/* Elite border frame */}
                      <div className="absolute -inset-px bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-xl opacity-0 group-hover/input:opacity-100 transition duration-300"></div>
                      
                      <input
                        type="text"
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Please enter your name"
                        className="relative w-full px-5 py-3.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:border-primary-400 text-base transition-all hover:border-primary-300 hover:bg-white shadow-sm font-medium"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Submit Button - Narrow & Shiny Transparent */}
                  <button
                    type="submit"
                    className="relative w-full group/btn transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {/* Elite outer border */}
                    <div className="absolute -inset-px bg-gradient-to-r from-primary-400/60 via-accent-400/60 to-primary-400/60 rounded-lg opacity-100 group-hover/btn:opacity-100 transition duration-300 blur-[0.5px]"></div>
                    
                    {/* Inner button - Narrow */}
                    <div className="relative py-3 px-5 rounded-lg overflow-hidden backdrop-blur-md">
                      {/* Shiny transparent gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/70 via-accent-500/70 to-primary-500/70 bg-[length:200%_100%] group-hover/btn:bg-[position:100%_0] transition-all duration-500"></div>
                      
                      {/* Glass shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                      
                      {/* Animated shine sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      
                      {/* Button content */}
                      <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                        <span className="text-base font-bold">Click for Menu</span>
                        <span className="text-xl group-hover/btn:rotate-12 transition-transform duration-300">🍽️</span>
                      </span>
                    </div>
                  </button>
                </form>

                {/* Decorative corner accents */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary-300 rounded-tl-2xl opacity-50"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-accent-300 rounded-tr-2xl opacity-50"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary-300 rounded-bl-2xl opacity-50"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent-300 rounded-br-2xl opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Subtle Bottom Banner */}
      <footer className="fixed bottom-0 left-0 right-0 z-0">
        <div className="w-full bg-white/60 backdrop-blur-sm border-t border-gray-200/50 py-2 shadow-sm">
          <p className="text-xs text-gray-500 text-center">
            Powered by{' '}
            <a
              href="https://www.devtechai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 font-semibold underline"
            >
              DevTechAi.Org
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
