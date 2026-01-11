-- Create data_operation_logs table for tracking all data operations
CREATE TABLE public.data_operation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL, -- 'rss', 'crime', 'weather', 'business', 'event', 'ai'
  operation_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error', 'warning'
  details TEXT,
  metadata JSONB DEFAULT '{}',
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_operation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage operation logs"
ON public.data_operation_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view operation logs"
ON public.data_operation_logs
FOR SELECT
USING (true);

-- Create index for faster filtering
CREATE INDEX idx_data_operation_logs_type ON public.data_operation_logs(operation_type);
CREATE INDEX idx_data_operation_logs_status ON public.data_operation_logs(status);
CREATE INDEX idx_data_operation_logs_created ON public.data_operation_logs(created_at DESC);