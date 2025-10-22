import DiscussionPanel from '@/components/discussion/DiscussionPanel';
import { Button } from '@/components/ui/button';
import { Briefcase, LogOut, MessageSquare, User } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [showDiscussions, setShowDiscussions] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-accent/30">
      {/* Top Navigation */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Briefcase className="w-6 h-6" />
            <span className="text-xl font-bold">Interview Prep Hub</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiscussions(!showDiscussions)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Discussions
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Discussion Panel */}
      {showDiscussions && (
        <DiscussionPanel onClose={() => setShowDiscussions(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
