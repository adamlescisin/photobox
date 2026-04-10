-- Fix the circular dependency on event_managers table
DROP POLICY IF EXISTS "Users can read own assignments" ON public.event_managers;

CREATE POLICY "event_managers_select" ON public.event_managers
  FOR SELECT
  USING (user_id = auth.uid());