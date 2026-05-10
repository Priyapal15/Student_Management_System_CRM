
-- Drop existing restrictive policies and add open ones for all tables

DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage students" ON public.students;
CREATE POLICY "Allow all access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage batches" ON public.batches;
CREATE POLICY "Allow all access to batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.attendance;
CREATE POLICY "Allow all access to attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage payments" ON public.payments;
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage fee_structures" ON public.fee_structures;
CREATE POLICY "Allow all access to fee_structures" ON public.fee_structures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage documents" ON public.documents;
CREATE POLICY "Allow all access to documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage timetable" ON public.timetable_entries;
CREATE POLICY "Allow all access to timetable_entries" ON public.timetable_entries FOR ALL USING (true) WITH CHECK (true);
