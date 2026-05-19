import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { SearchModalProvider } from "@/hooks/useSearchModal";
import { LanguageProvider } from "@/hooks/useLanguage";
import { SearchModal } from "@/components/search/SearchModal";
import { useSearchModal } from "@/hooks/useSearchModal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Index from "./pages/Index";

const News = lazy(() => import("./pages/News"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const EventSubmit = lazy(() => import("./pages/EventSubmit"));
const Businesses = lazy(() => import("./pages/Businesses"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const AddBusiness = lazy(() => import("./pages/AddBusiness"));
const Neighborhoods = lazy(() => import("./pages/Neighborhoods"));
const NeighborhoodDetail = lazy(() => import("./pages/NeighborhoodDetail"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ProfileSettings = lazy(() => import("./pages/settings/ProfileSettings"));
const NeighborhoodSettings = lazy(() => import("./pages/settings/NeighborhoodSettings"));
const NotificationSettings = lazy(() => import("./pages/settings/NotificationSettings"));
const AccountSettings = lazy(() => import("./pages/settings/AccountSettings"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminData = lazy(() => import("./pages/admin/AdminData"));
const AdminRssSources = lazy(() => import("./pages/admin/AdminRssSources"));
const AdminApiKeys = lazy(() => import("./pages/admin/AdminApiKeys"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter"));
const NewsletterPage = lazy(() => import("./pages/newsletter/NewsletterPage"));
const NewsletterVerify = lazy(() => import("./pages/newsletter/NewsletterVerify"));
const NewsletterUnsubscribe = lazy(() => import("./pages/newsletter/NewsletterUnsubscribe"));
const Search = lazy(() => import("./pages/Search"));
const CrimeMap = lazy(() => import("./pages/CrimeMap"));
const CrimeSection = lazy(() => import("./pages/CrimeSection"));
const Weather = lazy(() => import("./pages/Weather"));
const HurricaneCentral = lazy(() => import("./pages/HurricaneCentral"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
  </div>
);

function SearchModalWrapper() {
  const { isOpen, closeSearch } = useSearchModal();
  return <SearchModal isOpen={isOpen} onClose={closeSearch} />;
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <SearchModalProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <SearchModalWrapper />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/news/:slug" element={<ArticleDetail />} />
                      <Route path="/article/:slug" element={<ArticleDetail />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/events/submit" element={<EventSubmit />} />
                      <Route path="/events/:slug" element={<EventDetail />} />
                      <Route path="/event/:slug" element={<EventDetail />} />
                      <Route path="/businesses" element={<Businesses />} />
                      <Route path="/businesses/add" element={<AddBusiness />} />
                      <Route path="/businesses/:slug" element={<BusinessDetail />} />
                      <Route path="/business/:slug" element={<BusinessDetail />} />
                      <Route path="/neighborhoods" element={<Neighborhoods />} />
                      <Route path="/neighborhoods/:slug" element={<NeighborhoodDetail />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/crime" element={<CrimeMap />} />
                      <Route path="/news/crime-map" element={<CrimeMap />} />
                      <Route path="/news/crime" element={<CrimeSection />} />
                      <Route path="/weather" element={<Weather />} />
                      <Route path="/weather/hurricane" element={<HurricaneCentral />} />
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
                      <Route path="/admin/data" element={<AdminData />} />
                      <Route path="/admin/data/rss" element={<AdminRssSources />} />
                      <Route path="/admin/data/api-keys" element={<AdminApiKeys />} />
                      <Route path="/admin/data/logs" element={<AdminLogs />} />
                      <Route path="/admin/articles" element={<AdminArticles />} />
                      <Route path="/admin/events" element={<AdminEvents />} />
                      <Route path="/admin/businesses" element={<AdminBusinesses />} />
                      <Route path="/admin/ai" element={<AdminAI />} />
                      <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                      {/* Newsletter Routes */}
                      <Route path="/newsletter" element={<NewsletterPage />} />
                      <Route path="/newsletter/verify" element={<NewsletterVerify />} />
                      <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
                      {/* Legacy routes - redirect to new auth paths */}
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </SearchModalProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
