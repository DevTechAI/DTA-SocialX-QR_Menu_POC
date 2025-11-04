'use client';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header = ({ title = 'QR Menu', showBack = false, onBack }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 gradient-primary shadow-soft-lg">
      <div className="container-mobile py-4 flex items-center">
        {showBack && (
          <button
            onClick={onBack}
            className="mr-3 p-2 -ml-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
            aria-label="Go back"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
    </header>
  );
};
