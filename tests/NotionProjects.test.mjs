import { describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { createSnapshot, publicProject, readSchema } from '../scripts/notion-projects.mjs'

const config = JSON.parse(await readFile(new URL('../notion.config.json', import.meta.url), 'utf8'))
const id = '11111111-2222-4333-8444-555555555555'
const sourceId = '22222222-2222-4333-8444-555555555555'
const text = (content) => [{ type: 'text', text: { content } }]
const schema = () => ({ properties: {
  프로젝트명: { id: 'title', type: 'title', title: {} },
  '공개 태그': { id: 'tags', type: 'multi_select', multi_select: { options: [{ id: 'secret', name: '대외비' }] } },
  상태: { id: 'status', type: 'select', select: {} },
  설명: { id: 'summary', type: 'rich_text', rich_text: {} },
  '발사 예정일': { id: 'date', type: 'date', date: {} },
} })
const page = (tags = []) => ({ object: 'page', id, properties: {
  프로젝트명: { id: 'title', type: 'title', title: text('공개 프로젝트') },
  '공개 태그': { id: 'tags', type: 'multi_select', multi_select: tags },
  상태: { id: 'status', type: 'select', select: { name: '기획 중' } },
  설명: { id: 'summary', type: 'rich_text', rich_text: [...text('공개 설명'), { type: 'mention', plain_text: '내부 직원 이름' }] },
  '발사 예정일': { id: 'date', type: 'date', date: { start: '2026-10-12', end: null } },
  업무: { id: 'private-relation', type: 'relation', relation: [{ id: 'INTERNAL_ID' }] },
  이메일: { id: 'private-email', type: 'email', email: 'INTERNAL_EMAIL' },
}, url: 'INTERNAL_URL', body: 'INTERNAL_BODY' })
const result = (rows, more = false, cursor = null) => ({ results: rows, has_more: more, next_cursor: cursor })
function client(responses) {
  return vi.fn(async () => {
    const data = responses.shift()
    if (data instanceof Error) throw data
    if (!data) throw new Error('Unexpected request')
    return { ok: true, status: 200, json: async () => data }
  })
}
const database = { data_sources: [{ id: sourceId }] }
async function snapshot(responses) {
  const fetchImpl = client(responses)
  return { output: await createSnapshot(config, { token: 'TEST_TOKEN_ONLY', fetchImpl }), fetchImpl }
}

describe('Notion publication boundary', () => {
  it('uses original public copy and ignores legacy English fields', async () => {
    const bilingualSchema = schema()
    bilingualSchema.properties['프로젝트명 (EN)'] = { id: 'titleEn', type: 'rich_text', rich_text: {} }
    bilingualSchema.properties['설명 (EN)'] = { id: 'summaryEn', type: 'rich_text', rich_text: {} }
    const bilingualPage = page()
    bilingualPage.properties['프로젝트명 (EN)'] = { id: 'titleEn', type: 'rich_text', rich_text: text('Public project') }
    bilingualPage.properties['설명 (EN)'] = { id: 'summaryEn', type: 'rich_text', rich_text: [...text('Public summary'), { type: 'mention', plain_text: 'INTERNAL_PERSON' }] }
    const privatePage = structuredClone(bilingualPage)
    privatePage.id = sourceId
    privatePage.properties['공개 태그'].multi_select = [{ id: 'secret', name: '대외비' }]
    privatePage.properties['프로젝트명 (EN)'].rich_text = text('INTERNAL_ENGLISH')
    const { output, fetchImpl } = await snapshot([database, bilingualSchema, result([bilingualPage, privatePage]), bilingualSchema])
    expect(output.state).toBe('ready')
    expect(output.projects).toHaveLength(1)
    expect(output.projects[0]).toMatchObject({ title: '공개 프로젝트', summary: '공개 설명' })
    expect(output.projects[0]).not.toHaveProperty('titleEn')
    expect(output.projects[0]).not.toHaveProperty('summaryEn')
    expect(JSON.stringify(output)).not.toContain('INTERNAL')
    expect(fetchImpl.mock.calls[2][0].searchParams.getAll('filter_properties[]')).toEqual(['title', 'tags', 'status', 'summary', 'date'])
  })
  it('publishes untagged rows with only approved fields and maps status/date', () => {
    const exported = publicProject(page(), readSchema(schema(), config), config)
    expect(exported).toEqual({ slug: `project-${id.replaceAll('-', '')}`, title: '공개 프로젝트', status: '계획', period: '2026.10.12', summary: '공개 설명', body: [], specs: [], links: [] })
    expect(JSON.stringify(exported)).not.toMatch(/INTERNAL|내부 직원|TEST_TOKEN/)
  })
  it.each([
    [{ id: 'secret', name: 'renamed' }],
    [{ id: 'different', name: ' 대외비 ' }],
  ])('independently excludes confidential rows even if returned by the API: %j', (...tags) => {
    expect(publicProject(page(tags), readSchema(schema(), config), config)).toBeNull()
  })
  it('excludes archived and trashed pages', () => {
    for (const flag of ['archived', 'in_trash', 'is_archived']) {
      expect(publicProject({ ...page(), [flag]: true }, readSchema(schema(), config), config)).toBeNull()
    }
  })
  it('rejects missing or malformed tag values instead of assuming public', async () => {
    for (const value of [undefined, { id: 'tags', type: 'multi_select', multi_select: null }]) {
      const bad = page(); bad.properties['공개 태그'] = value
      const { output } = await snapshot([database, schema(), result([page(), bad])])
      expect(output.state).toBe('unavailable')
      expect(output.projects).toEqual([])
    }
  })
  it('rejects a deleted confidential option before querying rows', async () => {
    const missing = schema(); missing.properties['공개 태그'].multi_select.options = []
    const { output, fetchImpl } = await snapshot([database, missing])
    expect(output.errorCode).toBe('CONFIDENTIAL_TAG_MISSING')
    expect(output.projects).toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
  it('queries all pages with server filtering and only the five required properties', async () => {
    const second = { ...page(), id: '33333333-2222-4333-8444-555555555555' }
    const { output, fetchImpl } = await snapshot([database, schema(), result([page()], true, 'next'), result([second, page([{ id: 'secret', name: '대외비' }])]), schema()])
    expect(output.state).toBe('ready')
    expect(output.projects).toHaveLength(2)
    const [url, options] = fetchImpl.mock.calls[2]
    expect(url.origin).toBe('https://api.notion.com')
    expect(url.searchParams.getAll('filter_properties[]')).toEqual(['title', 'tags', 'status', 'summary', 'date'])
    expect(options.redirect).toBe('error')
    expect(JSON.parse(options.body).filter).toEqual({ property: 'tags', multi_select: { does_not_contain: '대외비' } })
    expect(JSON.parse(fetchImpl.mock.calls[3][1].body).start_cursor).toBe('next')
    expect(JSON.stringify(output)).not.toContain('TEST_TOKEN_ONLY')
  })
  it('discards partial results on a later network failure without logging the raw error', async () => {
    const { output } = await snapshot([database, schema(), result([page()], true, 'next'), new Error('TEST_TOKEN_ONLY INTERNAL_BODY')])
    expect(output).toEqual({ state: 'unavailable', fetchedAt: null, projects: [], errorCode: 'NOTION_UNAVAILABLE' })
  })
  it('rejects repeating pagination cursors', async () => {
    const { output } = await snapshot([database, schema(), result([page()], true, 'next'), result([page()], true, 'next')])
    expect(output.errorCode).toBe('CURSOR_INVALID')
    expect(output.projects).toEqual([])
  })
  it('rejects explicitly incomplete responses', async () => {
    const { output } = await snapshot([database, schema(), { ...result([page()]), request_status: { type: 'incomplete', incomplete_reason: 'query_limit' } }])
    expect(output.errorCode).toBe('QUERY_INCOMPLETE')
    expect(output.projects).toEqual([])
  })
  it('discards results if the tag is replaced during the sync', async () => {
    const changed = schema(); changed.properties['공개 태그'].multi_select.options[0].id = 'replacement'
    const { output } = await snapshot([database, schema(), result([page()]), changed])
    expect(output.errorCode).toBe('TAG_CHANGED_DURING_SYNC')
    expect(output.projects).toEqual([])
  })
  it('returns an empty snapshot if credentials are absent', async () => {
    expect(await createSnapshot(config, {})).toEqual({ state: 'unavailable', fetchedAt: null, projects: [], errorCode: 'TOKEN_MISSING' })
  })
})
