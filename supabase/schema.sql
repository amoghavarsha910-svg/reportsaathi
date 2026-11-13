create table if not exists public.saved_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    title text not null check (char_length(title) between 1 and 160),
    language text not null check (language in ('en', 'hi', 'kn')),
    summary jsonb not null check (jsonb_typeof(summary) = 'object'),
    created_at timestamptz not null default now()
);

create index if not exists saved_reports_user_created_idx
    on public.saved_reports (user_id, created_at desc);

alter table public.saved_reports enable row level security;

revoke all on table public.saved_reports from anon;
grant select, insert, delete on table public.saved_reports to authenticated;

drop policy if exists "Users can view their saved reports" on public.saved_reports;
create policy "Users can view their saved reports"
    on public.saved_reports for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their saved reports" on public.saved_reports;
create policy "Users can create their saved reports"
    on public.saved_reports for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their saved reports" on public.saved_reports;
create policy "Users can delete their saved reports"
    on public.saved_reports for delete to authenticated
    using ((select auth.uid()) = user_id);
