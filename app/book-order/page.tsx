'use client';

import { useRouter } from 'next/navigation';

type BookingOption = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  gradient: string;
  available: boolean;
};

const bookingOptions: BookingOption[] = [
  {
    id: 'food-order',
    title: 'Order Food & Coffee',
    description: 'Order delicious food & beverages',
    icon: '🍽️',
    route: '/order-menu',
    gradient: 'from-orange-500 to-orange-600',
    available: true,
  },
  {
    id: 'snooker',
    title: 'Book Snooker/Pool Table',
    description: 'Reserve a snooker board',
    icon: '🎱',
    route: '/book-snooker',
    gradient: 'from-blue-500 to-blue-600',
    available: true,
  },
  {
    id: 'cowork-seat',
    title: 'Reserve Workspace',
    description: 'Reserve a workspace seat',
    icon: '💼',
    route: '/book-workspace',
    gradient: 'from-green-500 to-green-600',
    available: true,
  },
  {
    id: 'eventspace',
    title: 'Events & WorkShops',
    description: 'Discover upcoming events and workshops',
    icon: '📅',
    route: 'https://linktr.ee/socialx.hub',
    gradient: 'from-purple-500 to-purple-600',
    available: true,
  },
];

export default function BookOrderPage() {
  const router = useRouter();

  const handleCardClick = (option: BookingOption) => {
    if (option.available) {
      // Check if it's an external URL (starts with http:// or https://)
      if (option.route.startsWith('http://') || option.route.startsWith('https://')) {
        // Navigate to external URL in the same window
        window.location.href = option.route;
      } else {
        // Internal route - use Next.js router
        router.push(option.route);
      }
    }
  };

  return (
    <main className="min-h-screen gradient-soft flex flex-col items-center w-full overflow-x-hidden">
        {/* Header with Banner Background */}
        <div className="w-full md:max-w-2xl lg:max-w-3xl shadow-soft-lg sticky top-0 z-10 relative overflow-hidden gradient-primary rounded-b-xl sm:rounded-b-2xl mb-3 sm:mb-4">
          {/* Content Layer with Banner Background */}
          <div 
            className="relative z-10 w-full px-4 py-4 sm:px-6 sm:py-8 md:py-10"
            style={{
              backgroundImage: 'url(/Menu_Header_OR_Footer_BG.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              minHeight: '20vh',
            }}
          >
            {/* Fogged Glossy Overlay - Extremely light tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8"></div>
            
            {/* Shiny Glass Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent"></div>
            
            {/* Content positioned above screen midline */}
            <div className="absolute inset-0 flex items-center justify-center transform -translate-y-12">
              <div className="text-center relative z-10">
                {/* Coffee Cup Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/40 backdrop-blur-md mb-3 sm:mb-4 mt-16 sm:mt-18 md:mt-20 shadow-soft-lg">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl mb-2 sm:mb-3" style={{ fontFamily: 'cursive', textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)' }}>
                  SocialX <span className="italic font-black" style={{ fontFamily: 'Georgia, serif', fontWeight: 900 }}>Hub</span>
                </h1>
              </div>
            </div>
            
            {/* Decorative circles with animation */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10"></div>
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 w-full -mt-24 sm:-mt-28 md:-mt-32 lg:-mt-36">
          <div className="w-full max-w-4xl">
        {/* Booking Options Grid */}
        {/* Mobile: Small emoji icons in 2x2 grid */}
        <div className="grid grid-cols-2 gap-4 md:hidden mt-16 sm:mt-18">
          {bookingOptions.map((option) => {
            // Helper function to get title parts
            const getTitleParts = () => {
              if (option.id === 'food-order') {
                return { line1: 'Order', line2: 'Food & Coffee', line3: null, singleLine: false };
              } else if (option.id === 'snooker') {
                return { line1: 'Book', line2: 'Snooker/Pool Table', line3: null, singleLine: false };
              } else if (option.id === 'eventspace') {
                return { line1: 'Events & WorkShops', line2: null, line3: null, singleLine: true };
              } else if (option.id === 'cowork-seat') {
                return { line1: 'Reserve', line2: 'Workspace', line3: null, singleLine: false };
              }
              return { line1: option.title, line2: null, line3: null, singleLine: false };
            };
            
            const titleParts = getTitleParts();
            const showWIP = !option.available && (option.id === 'snooker' || option.id === 'cowork-seat');
            
            return (
              <button
                key={option.id}
                onClick={() => handleCardClick(option)}
                disabled={!option.available}
                className={`
                  relative flex flex-col items-center justify-center p-4
                  bg-white rounded-xl shadow-soft-lg
                  transform transition-all duration-300
                  ${option.available 
                    ? 'hover:scale-105 hover:shadow-xl cursor-pointer active:scale-95' 
                    : 'cursor-not-allowed'
                  }
                `}
              >
                {/* WIP Icon - Top Right Corner */}
                {showWIP && (
                  <div className="absolute top-2 right-2">
                    <span className="text-lg">🚧</span>
                  </div>
                )}
                
                {/* Emoji Icon */}
                {option.available ? (
                  <div className={`
                    inline-flex items-center justify-center w-16 h-16 rounded-xl 
                    bg-gradient-to-br ${option.gradient}
                    mb-2 shadow-soft-lg
                  `}>
                    <span className="text-4xl">{option.icon}</span>
                  </div>
                ) : (
                  <div className="text-6xl mb-2 grayscale opacity-50">
                    {option.icon}
                  </div>
                )}
                
                {/* Title - Single Line (for Events & WorkShops) */}
                {titleParts.singleLine ? (
                  <h3 className={`text-xs sm:text-sm font-bold text-center leading-tight ${
                    option.available ? 'text-gray-800' : 'text-gray-400'
                  }`} style={{ paddingLeft: '5%', paddingRight: '5%', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                    {titleParts.line1}
                  </h3>
                ) : (
                  <>
                    {/* Title - Combined Line 1 and Line 2 */}
                    {titleParts.line1 && (
                      <h3 className={`text-xs sm:text-sm font-bold text-center leading-tight break-words ${
                        option.available ? 'text-gray-800' : 'text-gray-400'
                      }`} style={{ paddingLeft: '5%', paddingRight: '5%', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        {titleParts.line1}{titleParts.line2 ? ` ${titleParts.line2}` : ''}
                      </h3>
                    )}
                    
                    {/* Title - Line 3 (for Snooker/Pool Table) */}
                    {titleParts.line3 && (
                      <h3 className={`text-xs sm:text-sm font-bold text-center leading-tight break-words ${
                        option.available ? 'text-gray-800' : 'text-gray-400'
                      }`} style={{ paddingLeft: '5%', paddingRight: '5%', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        {titleParts.line3}
                      </h3>
                    )}
                  </>
                )}
                
                {/* Self-Order at Counter text */}
                {showWIP && (
                  <p className="text-[9px] text-gray-500 mt-1 text-center">Self-Order at Counter</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop: Full card layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 mt-24 md:mt-28">
          {bookingOptions.map((option) => {
            // Helper function to get title parts
            const getTitleParts = () => {
              if (option.id === 'food-order') {
                return { line1: 'Order', line2: 'Food & Coffee', line3: null, singleLine: false };
              } else if (option.id === 'snooker') {
                return { line1: 'Book', line2: 'Snooker/Pool Table', line3: null, singleLine: false };
              } else if (option.id === 'eventspace') {
                return { line1: 'Events & WorkShops', line2: null, line3: null, singleLine: true };
              } else if (option.id === 'cowork-seat') {
                return { line1: 'Reserve', line2: 'Workspace', line3: null, singleLine: false };
              }
              return { line1: option.title, line2: null, line3: null, singleLine: false };
            };
            
            const titleParts = getTitleParts();
            const showWIP = !option.available && (option.id === 'snooker' || option.id === 'cowork-seat');
            
            return (
              <button
                key={option.id}
                onClick={() => handleCardClick(option)}
                disabled={!option.available}
                className={`
                  relative bg-white rounded-xl shadow-soft-lg p-4
                  transform transition-all duration-300
                  ${option.available 
                    ? 'hover:scale-105 hover:shadow-2xl cursor-pointer active:scale-95' 
                    : 'opacity-60 cursor-not-allowed'
                  }
                  border-2 border-transparent
                  ${option.available ? 'hover:border-primary-300' : ''}
                `}
              >
                {/* WIP Icon - Top Right Corner */}
                {showWIP && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xl">🚧</span>
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  inline-flex items-center justify-center w-14 h-14 rounded-xl 
                  bg-gradient-to-br ${option.gradient}
                  mb-3 shadow-soft-lg mx-auto
                  ${option.available ? '' : 'grayscale'}
                `}>
                  <span className="text-4xl">{option.icon}</span>
                </div>

                {/* Content */}
                <div className="text-center" style={{ paddingLeft: '5%', paddingRight: '5%' }}>
                  {/* Title - Single Line (for Events & WorkShops) */}
                  {titleParts.singleLine ? (
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1.5 leading-tight" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                      {titleParts.line1}
                    </h2>
                  ) : (
                    <>
                      {/* Title - Line 1 */}
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                        {titleParts.line1}
                      </h2>
                      
                      {/* Title - Line 2 */}
                      {titleParts.line2 && (
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-0.5 leading-tight break-words" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                          {titleParts.line2}
                        </h2>
                      )}
                      
                      {/* Title - Line 3 (for Snooker/Pool Table) */}
                      {titleParts.line3 && (
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 leading-tight break-words" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                          {titleParts.line3}
                        </h2>
                      )}
                    </>
                  )}
                  
                  <p className="text-gray-600 mb-2 text-sm">
                    {option.description}
                  </p>
                  
                  {/* Status Badge */}
                  {option.available ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✓ Available
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 mb-1.5">
                        {option.id === 'snooker' || option.id === 'cowork-seat' || option.id === 'eventspace' 
                          ? 'For Now Check at Counter' 
                          : 'Coming Soon'}
                      </span>
                      {showWIP && (
                        <p className="text-xs text-gray-500 mt-1.5">Self-Order at Counter</p>
                      )}
                    </>
                  )}
                </div>

                {/* Arrow Icon (only for available options) */}
                {option.available && (
                  <div className="absolute top-4 right-4 text-gray-400 group-hover:text-primary-600 transition-colors">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SocialX Logo Card with Café Background */}
      <div className="w-full max-w-4xl mt-6 sm:mt-8">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-soft-xl transform hover:scale-105 transition-all duration-300">
          <div className="relative w-full h-48 sm:h-56 md:h-72 lg:h-80 p-6 sm:p-8 md:p-10" style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.75) 0%, rgba(251, 146, 60, 0.75) 100%)',
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
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/40 backdrop-blur-md mb-3 sm:mb-4 mt-16 sm:mt-18 md:mt-20 shadow-soft-lg">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-2xl mb-2 sm:mb-3" style={{ fontFamily: 'cursive' }}>
                  SocialX
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white/95 italic font-medium drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                  Hub
                </p>
              </div>
            </div>
            
            {/* Decorative circles with animation */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10"></div>
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm animate-pulse z-10" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer - Subtle Bottom Banner */}
    <footer className="w-full mt-auto">
      <div className="w-full bg-white/60 backdrop-blur-sm border-t border-gray-200/50 py-2 shadow-sm">
        <p className="text-xs text-gray-500 text-center">
          Tech Powered by{' '}
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

