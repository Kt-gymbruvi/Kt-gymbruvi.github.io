-- Persönliche Daten aus Lernangeboten (Turnierplaner, später Taktikboard) – nur für die angemeldete Lehrkraft.
-- Im Supabase-SQL-Editor (Quizzo-Projekt) ausführen. Rein ergänzend, ändert keine bestehende Tabelle.
-- Gäste (anon) haben keinen Zugriff; jede Lehrkraft sieht nur ihre eigenen Zeilen.

create table if not exists public.lernen_daten (
  besitzer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  angebot text not null check (angebot ~ '^[a-z0-9-]{1,60}$'),
  schluessel text not null check (char_length(schluessel) between 1 and 80),
  inhalt jsonb not null,
  geaendert_am timestamptz not null default now(),
  primary key (besitzer_id, angebot, schluessel),
  check (pg_column_size(inhalt) <= 1000000)
);

alter table public.lernen_daten enable row level security;

drop policy if exists lernen_daten_eigene on public.lernen_daten;
create policy lernen_daten_eigene on public.lernen_daten
  for all to authenticated
  using (besitzer_id = auth.uid())
  with check (besitzer_id = auth.uid());

revoke all on public.lernen_daten from anon;
grant select, insert, update, delete on public.lernen_daten to authenticated;
