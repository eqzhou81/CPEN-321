import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/config';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google: any;
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Initialize Google OAuth
      if (!window.google) {
        // Load Google OAuth script if not already loaded
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => initializeGoogleAuth();
        document.head.appendChild(script);
      } else {
        initializeGoogleAuth();
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Sign-in failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const initializeGoogleAuth = () => {
    window.google.accounts.id.initialize({
      client_id: config.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.prompt();
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      const result = await authService.signIn(response.credential);
      
      // Store auth token and user data
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      
      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // If user doesn't exist, try to sign them up
      if (error.response?.status === 404) {
        try {
          const result = await authService.signUp(response.credential);
          
          localStorage.setItem('authToken', result.data.token);
          localStorage.setItem('user', JSON.stringify(result.data.user));
          
          toast({
            title: 'Welcome!',
            description: 'Your account has been created successfully.',
          });
          
          navigate('/dashboard');
        } catch (signUpError: any) {
          console.error('Sign-up error:', signUpError);
          toast({
            title: 'Sign-up failed',
            description: signUpError.response?.data?.message || 'Please try again later.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Sign-in failed',
          description: error.response?.data?.message || 'Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAuth = () => {
    // Set mock authentication data
    localStorage.setItem('authToken', 'mock-token-123');
    localStorage.setItem('user', JSON.stringify({
      _id: '123',
      name: 'Demo User',
      email: 'demo@example.com',
      profilePicture: null
    }));
    
    toast({
      title: 'Demo Mode',
      description: 'You are now logged in as a demo user.',
    });
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Interview Prep Hub</CardTitle>
          <CardDescription className="text-base">
            Ace your interviews with AI-powered practice and expert insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          
          <Button 
            onClick={handleSkipAuth}
            variant="outline"
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            🚀 Skip Authentication (Demo Mode)
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>By continuing, you agree to our Terms of Service</p>
            <p>and Privacy Policy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
