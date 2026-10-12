// Runs only during builds. Raw Notion responses and credentials must never be
// written to the repository, build artifacts, or public workflow logs.
const API = 'https://api.notion.com/v1/'
const VERSION = '2026-03-11'
const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
const normalize = (value) => value.normalize('NFKC').trim()

export class SyncError extends Error {
  constructor(code) { super(code); this.code = code }
}

function requireValue(condition, code) {
  if (!condition) throw new SyncError(code)
}

function property(properties, key, types) {
  const value = properties?.[key] ?? Object.values(properties ?? {}).find((entry) => entry.id === key)
  requireValue(value && types.includes(value.type), 'PROPERTY_INVALID')
  return value
}

function textValue(value) {
  requireValue(Array.isArray(value), 'TEXT_INVALID')
  // Mentions can name internal pages or people. Only literal text is exported.
  return value.filter((item) => item.type === 'text').map((item) => {
    requireValue(typeof item.text?.content === 'string', 'TEXT_INVALID')
    return item.text.content
  }).join('').trim()
}

export function readSchema(schema, config) {
  requireValue(!schema.in_trash && !schema.archived, 'SOURCE_ARCHIVED')
  const keys = config.properties
  const mapping = {
    title: property(schema.properties, keys.title, ['title']),
    tags: property(schema.properties, keys.tags, ['multi_select']),
    status: property(schema.properties, keys.status, ['select', 'status']),
    summary: property(schema.properties, keys.summary, ['rich_text']),
    date: property(schema.properties, keys.date, ['date']),
  }
  const options = mapping.tags.multi_select?.options
  requireValue(Array.isArray(options), 'TAG_SCHEMA_INVALID')
  const tag = options.find((option) => normalize(option.name) === config.confidentialTag)
  // A renamed/deleted tag must never turn all records public by accident.
  requireValue(tag && typeof tag.id === 'string', 'CONFIDENTIAL_TAG_MISSING')
  return { mapping, confidentialId: tag.id }
}

export function publicProject(page, schema, config) {
  if (page.in_trash || page.archived || page.is_archived) return null
  requireValue(page.object === 'page' && UUID.test(page.id), 'PAGE_INVALID')
  const field = (key) => property(page.properties, schema.mapping[key].id, [schema.mapping[key].type])
  const tags = field('tags').multi_select
  requireValue(Array.isArray(tags) && tags.every((tag) => typeof tag.name === 'string' && typeof tag.id === 'string'), 'TAG_VALUE_INVALID')
  if (tags.some((tag) => tag.id === schema.confidentialId || normalize(tag.name) === config.confidentialTag)) return null

  const title = textValue(field('title').title)
  requireValue(title.length > 0, 'TITLE_EMPTY')
  const statusValue = field('status')
  const status = config.statusMap[statusValue[statusValue.type]?.name]
  requireValue(['계획', '진행 중', '완료', '아카이브'].includes(status), 'STATUS_UNMAPPED')
  const summary = textValue(field('summary').rich_text)
  const date = field('date').date
  const safeDate = (value) => {
    requireValue(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value), 'DATE_INVALID')
    return value.slice(0, 10).replaceAll('-', '.')
  }
  const period = date ? `${safeDate(date.start)}${date.end ? ` — ${safeDate(date.end)}` : ''}` : '일정 미정'
  return {
    slug: `project-${page.id.replaceAll('-', '').toLowerCase()}`,
    title, status, period, summary,
    body: [], specs: [], links: [],
  }
}

export async function fetchPublicProjects(config, { token, fetchImpl = fetch } = {}) {
  requireValue(typeof token === 'string' && token.length > 0, 'TOKEN_MISSING')
  requireValue(UUID.test(config.databaseId), 'DATABASE_ID_INVALID')
  const request = async (path, body) => {
    let response
    try {
      response = await fetchImpl(new URL(path, API), {
        method: body ? 'POST' : 'GET', redirect: 'error',
        headers: { Authorization: `Bearer ${token}`, 'Notion-Version': VERSION, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
      })
    } catch { throw new SyncError('NOTION_UNAVAILABLE') }
    // Do not copy response bodies or raw errors into public workflow logs.
    requireValue(response.ok, `NOTION_HTTP_${response.status}`)
    try { return await response.json() } catch { throw new SyncError('NOTION_RESPONSE_INVALID') }
  }

  const database = await request(`databases/${config.databaseId}`)
  requireValue(!database.in_trash && !database.archived, 'SOURCE_ARCHIVED')
  const sources = database.data_sources
  requireValue(Array.isArray(sources) && sources.length === 1 && UUID.test(sources[0].id), 'SOURCE_AMBIGUOUS')
  const id = sources[0].id
  const source = await request(`data_sources/${id}`)
  const schema = readSchema(source, config)
  const params = new URLSearchParams()
  for (const entry of Object.values(schema.mapping)) params.append('filter_properties[]', entry.id)
  const path = `data_sources/${id}/query?${params}`
  const projects = []
  const seenIds = new Set()
  const seenCursors = new Set()
  let cursor
  do {
    const result = await request(path, {
      filter: { property: schema.mapping.tags.id, multi_select: { does_not_contain: config.confidentialTag } },
      page_size: 100,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    requireValue(Array.isArray(result.results) && typeof result.has_more === 'boolean', 'QUERY_INVALID')
    requireValue(!result.request_status || (result.request_status.type === 'complete' && !result.request_status.incomplete_reason), 'QUERY_INCOMPLETE')
    for (const row of result.results) {
      const project = publicProject(row, schema, config)
      if (project && !seenIds.has(project.slug)) {
        seenIds.add(project.slug)
        projects.push(project)
      }
    }
    if (!result.has_more) break
    cursor = result.next_cursor
    requireValue(typeof cursor === 'string' && cursor.length > 0 && !seenCursors.has(cursor), 'CURSOR_INVALID')
    seenCursors.add(cursor)
    requireValue(seenCursors.size < 100, 'QUERY_TOO_LARGE')
  } while (cursor)

  // Check the tag still exists after pagination before exporting anything.
  const finalSchema = readSchema(await request(`data_sources/${id}`), config)
  requireValue(finalSchema.confidentialId === schema.confidentialId, 'TAG_CHANGED_DURING_SYNC')
  return projects
}

export async function createSnapshot(config, options) {
  try {
    const projects = await fetchPublicProjects(config, options)
    return { state: 'ready', fetchedAt: new Date().toISOString(), projects }
  } catch (error) {
    return { state: 'unavailable', fetchedAt: null, projects: [], errorCode: error instanceof SyncError ? error.code : 'SYNC_FAILED' }
  }
}
