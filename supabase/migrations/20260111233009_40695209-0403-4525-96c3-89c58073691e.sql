-- Create event_reminders table for user notifications
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reminders
CREATE POLICY "Users can view own reminders"
ON public.event_reminders
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own reminders"
ON public.event_reminders
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reminders"
ON public.event_reminders
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders"
ON public.event_reminders
FOR DELETE
USING (user_id = auth.uid());

-- Index for efficient reminder queries
CREATE INDEX idx_event_reminders_pending 
ON public.event_reminders(remind_at, reminded) 
WHERE reminded = false;