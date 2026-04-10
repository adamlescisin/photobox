-- Remove the old policy that still has the circular dependency
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

-- Verify only the simple policy remains
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'user_roles';