
-- Add RLS policy to allow staff to view all subscriptions
INSERT INTO supabase_migrations.schema_migrations (version, statements) VALUES (
  '20241229000001',
  ARRAY[
    'CREATE POLICY "Staff can view all subscriptions" ON public.subscribers FOR SELECT USING (is_staff(auth.uid()));'
  ]
);

-- Apply the policy
CREATE POLICY "Staff can view all subscriptions" ON public.subscribers FOR SELECT USING (is_staff(auth.uid()));
