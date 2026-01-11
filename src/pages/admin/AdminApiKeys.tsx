import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ApiConfig {
  id: string;
  name: string;
  description: string;
  secretName: string;
  isConfigured: boolean;
  isRequired: boolean;
  docsUrl?: string;
  testable: boolean;
}

const API_CONFIGS: ApiConfig[] = [
  {
    id: 'geoapify',
    name: 'Geoapify',
    description: 'Used for geocoding addresses and importing business data',
    secretName: 'GEOAPIFY_API_KEY',
    isConfigured: true, // Based on secrets list
    isRequired: true,
    docsUrl: 'https://www.geoapify.com/get-started-with-maps-api',
    testable: true,
  },
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    description: 'Import events from Eventbrite for the Jacksonville area',
    secretName: 'EVENTBRITE_API_KEY',
    isConfigured: true,
    isRequired: false,
    docsUrl: 'https://www.eventbrite.com/platform/api',
    testable: true,
  },
  {
    id: 'news-api',
    name: 'News API',
    description: 'Alternative news source for additional coverage',
    secretName: 'NEWS_API_KEY',
    isConfigured: true,
    isRequired: false,
    docsUrl: 'https://newsapi.org/docs/get-started',
    testable: true,
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email service for newsletters and notifications',
    secretName: 'RESEND_API_KEY',
    isConfigured: true,
    isRequired: true,
    docsUrl: 'https://resend.com/docs/introduction',
    testable: true,
  },
  {
    id: 'nws',
    name: 'National Weather Service',
    description: 'Weather data and alerts (no API key required)',
    secretName: '',
    isConfigured: true,
    isRequired: true,
    docsUrl: 'https://www.weather.gov/documentation/services-web-api',
    testable: false,
  },
  {
    id: 'jso-crime',
    name: 'JSO Crime Data',
    description: 'Jacksonville Sheriff\'s Office crime reports (public API)',
    secretName: '',
    isConfigured: true,
    isRequired: true,
    docsUrl: 'https://transparency.jaxsheriff.org/',
    testable: false,
  },
];

const AdminApiKeys = () => {
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleEditClick = (api: ApiConfig) => {
    setEditingApi(api);
    setApiKey('');
    setShowKey(false);
    setTestResult(null);
  };

  const handleTestApi = async () => {
    if (!editingApi) return;
    
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test API based on type
      let success = false;
      let message = '';

      switch (editingApi.id) {
        case 'geoapify':
          const geoResponse = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=Jacksonville,FL&apiKey=${apiKey || 'test'}`
          );
          success = geoResponse.ok;
          message = success ? 'API key is valid' : `API returned ${geoResponse.status}`;
          break;

        case 'eventbrite':
          // Eventbrite requires OAuth, so we just check format
          success = apiKey.length > 20;
          message = success ? 'API key format looks valid' : 'API key seems too short';
          break;

        case 'resend':
          // Check if starts with re_
          success = apiKey.startsWith('re_');
          message = success ? 'API key format is valid' : 'Resend keys should start with "re_"';
          break;

        case 'news-api':
          const newsResponse = await fetch(
            `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`
          );
          success = newsResponse.ok;
          message = success ? 'API key is valid' : `API returned ${newsResponse.status}`;
          break;

        default:
          message = 'Test not available for this API';
      }

      setTestResult({ success, message });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = () => {
    if (!editingApi) return;
    
    // Note: In production, this would use the secrets management tool
    // For now, we show a message about using the Lovable secrets UI
    toast.info(
      'API keys are managed through Lovable Cloud. Use the Secrets panel to update this key.',
      { duration: 5000 }
    );
    setEditingApi(null);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/admin/data"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Data Management
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Key className="w-8 h-8 text-amber-500" />
            API Keys
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys and external service integrations
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">API Key Security</p>
              <p className="text-sm text-amber-700">
                API keys are stored securely in Lovable Cloud. They are never exposed in client-side code 
                and are only accessible to backend functions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {API_CONFIGS.map((api) => (
          <Card key={api.id} className="bg-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{api.name}</h3>
                    {api.isRequired && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {api.description}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {api.secretName ? (
                      <>
                        {api.isConfigured ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Configured
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          {api.secretName}
                        </span>
                      </>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        No Key Required
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {api.secretName && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(api)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      {api.isConfigured ? 'Update' : 'Add'}
                    </Button>
                  )}
                  {api.docsUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a href={api.docsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Docs
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingApi} onOpenChange={(open) => !open && setEditingApi(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingApi?.isConfigured ? 'Update' : 'Add'} {editingApi?.name} API Key
            </DialogTitle>
            <DialogDescription>
              {editingApi?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={editingApi?.isConfigured ? '••••••••••••••••' : 'Enter API key'}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {editingApi?.testable && apiKey && (
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestApi}
                  disabled={isTesting || !apiKey}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test API Key'
                  )}
                </Button>
                
                {testResult && (
                  <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                    testResult.success 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">How to get an API key:</p>
              {editingApi?.docsUrl && (
                <a 
                  href={editingApi.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Visit {editingApi.name} documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingApi(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveKey} disabled={!apiKey}>
              Save Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminApiKeys;
