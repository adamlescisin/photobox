-- Fix the circular dependency by simplifying the user_roles RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;

-- Create a simple policy that only checks if the user is querying their own role
-- This breaks the circular dependency
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());