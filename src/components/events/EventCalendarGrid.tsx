import { useState, useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

interface EventCalendarGridProps {
  events: Tables<'events'>[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-purple-500',
  sports: 'bg-orange-500',
  family: 'bg-blue-500',
  food: 'bg-rose-500',
  arts: 'bg-pink-500',
  community: 'bg-teal-500',
  business: 'bg-emerald-500',
  nightlife: 'bg-indigo-500',
  government: 'bg-gray-500',
};

export const EventCalendarGrid = ({
  events,
  selectedDate,
  onDateSelect,
  isLoading,
}: EventCalendarGridProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Tables<'events'>[]>();
    events.forEach(event => {
      const dateKey = format(parseISO(event.start_time), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    onDateSelect(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card rounded-xl shadow-card p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={cn(
                "relative aspect-square p-1 rounded-lg transition-all duration-200 flex flex-col items-center justify-start",
                isCurrentMonth ? 'hover:bg-muted' : 'opacity-40',
                isSelected && 'bg-accent text-accent-foreground hover:bg-accent',
                isTodayDate && !isSelected && 'ring-2 ring-accent ring-inset'
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                !isCurrentMonth && 'text-muted-foreground',
                isSelected && 'text-accent-foreground',
                isTodayDate && !isSelected && 'text-accent font-bold'
              )}>
                {format(day, 'd')}
              </span>

              {/* Event Dots */}
              {hasEvents && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        CATEGORY_COLORS[event.category] || 'bg-muted-foreground',
                        isSelected && 'bg-accent-foreground/60'
                      )}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={cn(
                      "text-[10px]",
                      isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'
                    )}>
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
        {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={cn("w-2 h-2 rounded-full", color)} />
            <span className="capitalize">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
