const express = require('express')
const httpProxy = require('http-proxy')

const app = express()

// 🔥 IMPORTANT (for Render / cloud)
const PORT = process.env.PORT || 8000

const BASE_PATH = 'https://vercel-clone-myproject.s3.eu-north-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy()

app.use((req, res) => {
    const hostname = req.hostname

    // 🧠 LOCAL REDIRECT (for localhost dev)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (req.path === '/favicon.ico') {
            return res.sendStatus(204)
        }

        const [projectSlug, ...restPath] = req.path.replace(/^\/+/, '').split('/')
        if (!projectSlug) {
            return res.status(404).send('Project slug is required')
        }

        const path = restPath.length > 0 ? `/${restPath.join('/')}` : '/'
        return res.redirect(302, `http://${projectSlug}.localhost:${PORT}${path}`)
    }

    // 🌍 PRODUCTION SUBDOMAIN
    const subdomain = hostname.split('.')[0]

    let path = req.url

    // 👉 fix root path
    if (path === '/' || path === '') {
        path = '/index.html'
    }

    const target = `${BASE_PATH}/${subdomain}${path}`

    return proxy.web(req, res, {
        target,
        changeOrigin: true
    })
})

proxy.on('error', (error, req, res) => {
    if (!res.headersSent) {
        res.status(502).send(`Proxy error: ${error.message}`)
    }
})

app.listen(PORT, () => console.log(`🚀 Proxy Running on ${PORT}`))