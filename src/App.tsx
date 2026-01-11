import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import News from "./pages/News";
import ArticleDetail from "./pages/ArticleDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventSubmit from "./pages/EventSubmit";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import AddBusiness from "./pages/AddBusiness";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ProfileSettings from "./pages/settings/ProfileSettings";
import NeighborhoodSettings from "./pages/settings/NeighborhoodSettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import AccountSettings from "./pages/settings/AccountSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<ArticleDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/submit" element={<EventSubmit />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/businesses/add" element={<AddBusiness />} />
            <Route path="/businesses/:slug" element={<BusinessDetail />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            {/* Settings Routes */}
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/neighborhoods" element={<NeighborhoodSettings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/account" element={<AccountSettings />} />
            <Route path="/profile" element={<ProfileSettings />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/articles" element={<AdminArticles />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/businesses" element={<AdminBusinesses />} />
            {/* Legacy routes - redirect to new auth paths */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
