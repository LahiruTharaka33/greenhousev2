import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Hamburger Safe Zone - Mobile Only */}
      <div className="hamburger-safe-zone lg:hidden" aria-hidden="true"></div>
      
      <Sidebar />
      {/* Main content area with responsive margin */}
      <div className="flex-1 lg:ml-64 w-full transition-all duration-300 ease-in-out">
        <div className="min-h-screen w-full">
          {children}
        </div>
      </div>
    </div>
  );
} 