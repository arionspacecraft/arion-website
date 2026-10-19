import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import type { QuestionPage } from '../src/lib/qna'

let db: PGlite
const visitor = '00000000-0000-4000-8000-000000000001'
const operator = '00000000-0000-4000-8000-000000000002'
const other = '00000000-0000-4000-8000-000000000003'
beforeAll(async () => {
  db = await PGlite.create()
  // Simulate only the Auth schema and gateway-provided JWT, then execute the
  // actual migration and PostgreSQL permissions. This is not a live Auth test.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims', true)::jsonb $$;
    grant usage on schema auth to anon, authenticated;
    insert into auth.users values ('${visitor}'), ('${operator}'), ('${other}');
  `)
  await db.exec(readFileSync(new URL('../supabase/migrations/202610190001_qna.sql', import.meta.url), 'utf8'))
}, 30000)
afterAll(async () => { await db?.close() })
beforeEach(async () => {
  await db.exec('reset role; truncate qna_private.answers, qna_private.questions, qna_private.staff;')
  await db.query('insert into qna_private.staff values ($1)', [operator])
})
async function asUser(user = '', anonymous = true) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [user, JSON.stringify({ sub: user, is_anonymous: anonymous })])
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`)
}
async function submit(title = '로켓 질문', body = '어떻게 참여하나요?', requestId = crypto.randomUUID()) {
  const result = await db.query<{ id: string }>('select public.qna_submit($1, $2, $3, $4) as id', ['', title, body, requestId])
  return result.rows[0].id
}
async function list(query = '', page = 0) {
  return (await db.query<{ page: QuestionPage }>('select public.qna_list($1, $2) as page', [query, page])).rows[0].page
}

it('persists a question and publishes only allowed fields to a different unauthenticated visitor', async () => {
  await asUser(visitor)
  const id = await submit()
  await asUser()
  expect(await list()).toEqual({ total: 1, questions: [{ id, nickname: '', title: '로켓 질문', body: '어떻게 참여하나요?', created_at: expect.any(String), answer: null, answered_at: null }] })
  await expect(db.query('select * from qna_private.questions')).rejects.toThrow(/permission denied/)
  await expect(submit()).rejects.toThrow(/permission denied/)
})
it('denies forged answers, hiding and direct table writes even for an authenticated visitor', async () => {
  await asUser(visitor)
  const id = await submit()
  for (const anonymous of [true, false]) {
    await asUser(other, anonymous)
    await expect(db.query('select public.qna_answer($1, $2)', [id, 'forged'])).rejects.toThrow('QNA_FORBIDDEN')
    await expect(db.query('select public.qna_hide($1)', [id])).rejects.toThrow('QNA_FORBIDDEN')
    await expect(db.query('insert into qna_private.staff values ($1)', [other])).rejects.toThrow(/permission denied/)
    await expect(db.query('update qna_private.questions set hidden_at = now()')).rejects.toThrow(/permission denied/)
  }
})
it('allows registered non-anonymous staff to answer, edit and hide without deleting the record', async () => {
  await asUser(visitor)
  const id = await submit()
  await asUser(operator, true)
  await expect(db.query('select public.qna_answer($1, $2)', [id, '답변'])).rejects.toThrow('QNA_FORBIDDEN')
  await asUser(operator, false)
  await db.query('select public.qna_answer($1, $2)', [id, '  운영진 답변  '])
  await db.query('select public.qna_answer($1, $2)', [id, '수정한 답변'])
  await asUser()
  expect((await list()).questions[0].answer).toBe('수정한 답변')
  await asUser(operator, false)
  await db.query('select public.qna_hide($1)', [id])
  await expect(db.query('select public.qna_answer($1, $2)', [id, '답변'])).rejects.toThrow('QNA_NOT_FOUND')
  await asUser()
  expect(await list()).toEqual({ questions: [], total: 0 })
  await db.exec('reset role')
  expect((await db.query('select id from qna_private.questions')).rows).toHaveLength(1)
})
it('deduplicates uncertain retries and enforces minute and daily quotas on the server', async () => {
  await asUser(visitor)
  const requestId = crypto.randomUUID()
  const id = await submit('질문', '내용', requestId)
  expect(await submit('질문', '내용', requestId)).toBe(id)
  await expect(submit()).rejects.toThrow('QNA_RATE_LIMIT')
  await db.exec('reset role')
  await db.query("update qna_private.questions set created_at = now() - interval '2 minutes'")
  await db.query("insert into qna_private.questions (author_id, request_id, nickname, title, body, created_at) select $1, gen_random_uuid(), '', '질문', '내용', now() - interval '2 minutes' from generate_series(1,9)", [visitor])
  await asUser(visitor)
  await expect(submit()).rejects.toThrow('QNA_RATE_LIMIT')
  await asUser(other)
  await expect(submit()).resolves.toEqual(expect.any(String))
})
it('rejects empty and oversized content and requires real authenticated identities', async () => {
  await asUser(visitor)
  for (const [title, body] of [['   ', '내용'], ['제목', ''], ['x'.repeat(101), '내용'], ['제목', 'x'.repeat(2001)]]) {
    await expect(submit(title, body)).rejects.toThrow('QNA_INVALID')
  }
  await asUser(operator, false)
  await expect(db.query('select public.qna_answer($1, $2)', [crypto.randomUUID(), ' '])).rejects.toThrow('QNA_INVALID')
})
it('searches literal text including percent signs, bounds pages and never leaks hidden matches', async () => {
  await db.query("insert into qna_private.questions (author_id, request_id, nickname, title, body) select $1, gen_random_uuid(), '', '질문 ' || n, case when n = 21 then '100% Rocket' else '본문' end from generate_series(1,21) n", [visitor])
  await asUser()
  expect((await list()).questions).toHaveLength(20)
  expect((await list('', 1)).questions).toHaveLength(1)
  expect((await list('', -1)).questions).toHaveLength(20)
  expect((await list('%')).total).toBe(1)
  expect((await list('rocket')).total).toBe(1)
  expect((await list("' OR TRUE --")).total).toBe(0)
})
