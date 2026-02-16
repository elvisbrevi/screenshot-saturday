import { Hono } from 'hono'
import { renderer } from './renderer'
import { fetchPosts } from './reddit'
import { Page } from './components/Page'

const app = new Hono()

app.use(renderer)

app.get('/api/posts', async (c) => {
  const after = c.req.query('after')
  const dateFrom = c.req.query('date_from')
  const dateTo = c.req.query('date_to')

  const data = await fetchPosts({
    after: after || undefined,
    dateFrom: dateFrom ? Number(dateFrom) : undefined,
    dateTo: dateTo ? Number(dateTo) : undefined,
  })

  return c.json(data)
})

app.get('/', async (c) => {
  const data = await fetchPosts({})
  return c.render(<Page initialData={data} />)
})

export default app
