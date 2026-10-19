-- Public functions expose only question text and answers. Identity and moderation
-- records remain in an unexposed schema. Run as the database owner.
begin;
create schema if not exists qna_private;
revoke all on schema qna_private from public, anon, authenticated;

create table qna_private.staff (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table qna_private.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  request_id uuid not null,
  nickname text not null check (char_length(nickname) <= 40),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  hidden_at timestamptz,
  hidden_by uuid references auth.users(id),
  unique (author_id, request_id)
);
create index qna_public_order on qna_private.questions (created_at desc, id desc) where hidden_at is null;
create index qna_author_rate on qna_private.questions (author_id, created_at desc);
create table qna_private.answers (
  question_id uuid primary key references qna_private.questions(id),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  answered_at timestamptz not null default now(),
  answered_by uuid not null references auth.users(id)
);
alter table qna_private.staff enable row level security;
alter table qna_private.questions enable row level security;
alter table qna_private.answers enable row level security;
revoke all on all tables in schema qna_private from public, anon, authenticated;

create function public.qna_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from qna_private.staff where user_id = auth.uid())
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, true) = false;
$$;

create function public.qna_list(p_query text default '', p_page integer default 0) returns jsonb
language sql stable security definer set search_path = '' as $$
  with matching as (
    select q.id, q.nickname, q.title, q.body, q.created_at,
      a.body as answer, a.answered_at
    from qna_private.questions q
    left join qna_private.answers a on a.question_id = q.id
    where q.hidden_at is null and position(lower(left(coalesce(p_query, ''), 100)) in lower(q.title || ' ' || q.body)) > 0
  ), page as (
    select * from matching order by created_at desc, id desc
    limit 20 offset (greatest(0, least(coalesce(p_page, 0), 100000))::bigint * 20)
  )
  select jsonb_build_object('total', (select count(*) from matching),
    'questions', coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc, id desc) from page), '[]'::jsonb));
$$;

create function public.qna_submit(p_nickname text, p_title text, p_body text, p_request_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); existing_id uuid;
begin
  if caller is null then raise exception 'QNA_FORBIDDEN' using errcode = '42501'; end if;
  if p_request_id is null or p_title is null or p_body is null
    or char_length(btrim(p_title)) not between 1 and 100
    or char_length(btrim(p_body)) not between 1 and 2000
    or char_length(btrim(coalesce(p_nickname, ''))) > 40 then
    raise exception 'QNA_INVALID' using errcode = '22023';
  end if;
  -- Serialize this author's submissions so concurrent requests cannot evade limits.
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  select id into existing_id from qna_private.questions where author_id = caller and request_id = p_request_id;
  if existing_id is not null then return existing_id; end if;
  if exists (select 1 from qna_private.questions where author_id = caller and created_at > now() - interval '1 minute')
    or (select count(*) from qna_private.questions where author_id = caller and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'QNA_RATE_LIMIT' using errcode = 'P0001';
  end if;
  insert into qna_private.questions (author_id, request_id, nickname, title, body)
  values (caller, p_request_id, btrim(coalesce(p_nickname, '')), btrim(p_title), btrim(p_body))
  returning id into existing_id;
  return existing_id;
end;
$$;

create function public.qna_answer(p_id uuid, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.qna_is_staff() then raise exception 'QNA_FORBIDDEN' using errcode = '42501'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 4000 then
    raise exception 'QNA_INVALID' using errcode = '22023';
  end if;
  perform 1 from qna_private.questions where id = p_id and hidden_at is null for update;
  if not found then raise exception 'QNA_NOT_FOUND' using errcode = 'P0002'; end if;
  insert into qna_private.answers (question_id, body, answered_by)
  values (p_id, btrim(p_body), auth.uid())
  on conflict (question_id) do update set body = excluded.body, answered_by = excluded.answered_by, answered_at = now();
end;
$$;

create function public.qna_hide(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.qna_is_staff() then raise exception 'QNA_FORBIDDEN' using errcode = '42501'; end if;
  update qna_private.questions set hidden_at = now(), hidden_by = auth.uid() where id = p_id and hidden_at is null;
  if not found then raise exception 'QNA_NOT_FOUND' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.qna_is_staff() from public, anon, authenticated;
revoke all on function public.qna_list(text, integer) from public, anon, authenticated;
revoke all on function public.qna_submit(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.qna_answer(uuid, text) from public, anon, authenticated;
revoke all on function public.qna_hide(uuid) from public, anon, authenticated;
grant execute on function public.qna_list(text, integer) to anon, authenticated;
grant execute on function public.qna_is_staff() to authenticated;
grant execute on function public.qna_submit(text, text, text, uuid) to authenticated;
grant execute on function public.qna_answer(uuid, text) to authenticated;
grant execute on function public.qna_hide(uuid) to authenticated;
commit;
