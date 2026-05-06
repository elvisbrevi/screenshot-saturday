import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Screenshot Saturday — Indie Game Screenshots</title>
        <meta
          name="description"
          content="Browse the best #ScreenshotSaturday and #gamedev posts from Reddit, Bluesky and Mastodon."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,500&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        <script src="/static/app.js" defer></script>
      </body>
    </html>
  )
})
