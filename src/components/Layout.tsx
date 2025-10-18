import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-64 w-full">
        <div className="min-h-screen w-full">
          {children}
        </div>
      </div>
    </div>
  );
} 