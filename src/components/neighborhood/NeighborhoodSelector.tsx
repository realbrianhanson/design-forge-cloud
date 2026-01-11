import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';

interface NeighborhoodSelectorProps {
  currentSlug?: string;
}

export function NeighborhoodSelector({ currentSlug }: NeighborhoodSelectorProps) {
  const navigate = useNavigate();
  const { data: neighborhoods, isLoading } = useNeighborhoods();

  if (isLoading || !neighborhoods) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-muted-foreground" />
      <Select 
        value={currentSlug} 
        onValueChange={(slug) => navigate(`/neighborhoods/${slug}`)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Jump to neighborhood" />
        </SelectTrigger>
        <SelectContent>
          {neighborhoods.map((neighborhood) => (
            <SelectItem key={neighborhood.id} value={neighborhood.slug}>
              {neighborhood.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
