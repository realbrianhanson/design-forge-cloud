import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { useAuth } from '@/hooks/useAuth';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NeighborhoodSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: neighborhoods = [], isLoading } = useNeighborhoods();

  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [primaryNeighborhood, setPrimaryNeighborhood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial state from profile
  useEffect(() => {
    if (profile?.primary_neighborhood_id) {
      setPrimaryNeighborhood(profile.primary_neighborhood_id);
      setSelectedNeighborhoods([profile.primary_neighborhood_id]);
    }
  }, [profile]);

  const handleNeighborhoodToggle = (neighborhoodId: string) => {
    setSelectedNeighborhoods(prev => {
      if (prev.includes(neighborhoodId)) {
        // Remove neighborhood
        const updated = prev.filter(id => id !== neighborhoodId);
        // If this was the primary, clear it
        if (primaryNeighborhood === neighborhoodId) {
          setPrimaryNeighborhood(updated[0] || null);
        }
        return updated;
      } else {
        // Add neighborhood
        return [...prev, neighborhoodId];
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          primary_neighborhood_id: primaryNeighborhood,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Neighborhoods saved',
        description: 'Your neighborhood preferences have been updated',
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Your Neighborhoods</h1>
          <p className="text-muted-foreground mt-1">
            Select neighborhoods to personalize your news feed
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Neighborhood Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {neighborhoods.map((neighborhood) => (
                <div
                  key={neighborhood.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedNeighborhoods.includes(neighborhood.id)
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => handleNeighborhoodToggle(neighborhood.id)}
                >
                  <Checkbox
                    checked={selectedNeighborhoods.includes(neighborhood.id)}
                    onCheckedChange={() => handleNeighborhoodToggle(neighborhood.id)}
                  />
                  <span className="font-medium text-primary">{neighborhood.name}</span>
                </div>
              ))}
            </div>

            {/* Primary Neighborhood Selection */}
            {selectedNeighborhoods.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold text-primary mb-4">Set as Primary</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your primary neighborhood is used for "Your Neighborhood" on the homepage
                </p>
                <RadioGroup
                  value={primaryNeighborhood || ''}
                  onValueChange={setPrimaryNeighborhood}
                >
                  <div className="space-y-3">
                    {selectedNeighborhoods.map((id) => {
                      const neighborhood = neighborhoods.find(n => n.id === id);
                      if (!neighborhood) return null;
                      return (
                        <div key={id} className="flex items-center space-x-3">
                          <RadioGroupItem value={id} id={`primary-${id}`} />
                          <Label htmlFor={`primary-${id}`} className="cursor-pointer">
                            {neighborhood.name}
                          </Label>
                          {primaryNeighborhood === id && (
                            <span className="text-xs text-accent font-medium">Primary</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent hover:bg-accent/90"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default NeighborhoodSettings;
