import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSetting {
  key: 'email_daily_digest' | 'email_weekly_newsletter' | 'email_breaking_news';
  label: string;
  description: string;
}

const notificationSettings: NotificationSetting[] = [
  {
    key: 'email_daily_digest',
    label: 'Daily Digest',
    description: 'Morning news summary delivered to your inbox',
  },
  {
    key: 'email_weekly_newsletter',
    label: 'Weekly Newsletter',
    description: 'Weekend recap of top stories and events',
  },
  {
    key: 'email_breaking_news',
    label: 'Breaking News Alerts',
    description: 'Major stories as they happen',
  },
];

const NotificationSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    email_daily_digest: true,
    email_weekly_newsletter: true,
    email_breaking_news: false,
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Load initial state from profile
  useEffect(() => {
    if (profile) {
      setSettings({
        email_daily_digest: profile.email_daily_digest ?? true,
        email_weekly_newsletter: profile.email_weekly_newsletter ?? true,
        email_breaking_news: profile.email_breaking_news ?? false,
      });
    }
  }, [profile]);

  const handleToggle = async (key: NotificationSetting['key']) => {
    if (!user) return;

    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSavingKey(key);
    setSavedKey(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ [key]: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (error: any) {
      console.error('Toggle error:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      toast({
        title: 'Save failed',
        description: 'Failed to update notification preference',
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Email Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Manage how you receive updates from 904News
          </p>
        </div>

        <div className="space-y-6">
          {notificationSettings.map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between py-4 border-b border-border last:border-0"
            >
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-primary">{setting.label}</h3>
                  {savedKey === setting.key && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <Check className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {setting.description}
                </p>
              </div>
              <Switch
                checked={settings[setting.key]}
                onCheckedChange={() => handleToggle(setting.key)}
                disabled={savingKey === setting.key}
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            You can unsubscribe from any email by clicking the link at the bottom of the message.
          </p>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default NotificationSettings;
