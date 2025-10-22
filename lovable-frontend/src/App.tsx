import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import BehavioralQuestions from "./pages/BehavioralQuestions";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import JobDetails from "./pages/JobDetails";
import JobQuestions from "./pages/JobQuestions";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import TechnicalQuestions from "./pages/TechnicalQuestions";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/job/:jobId" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
          <Route path="/job/:jobId/questions" element={<ProtectedRoute><JobQuestions /></ProtectedRoute>} />
          <Route path="/job/:jobId/technical" element={<ProtectedRoute><TechnicalQuestions /></ProtectedRoute>} />
          <Route path="/job/:jobId/behavioral" element={<ProtectedRoute><BehavioralQuestions /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
