const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = Number(process.env.PORT || 8000)

const BASE_PATH = process.env.S3_OUTPUTS_BASE_PATH || 'https://vercel-clone-myproject.s3.eu-north-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy()

app.use((req, res) => {
    const hostname = req.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (req.path === '/favicon.ico') {
            return res.sendStatus(204)
        }

        const [projectSlug, ...restPath] = req.path.replace(/^\/+/, '').split('/')
        if (!projectSlug) {
            return res.status(404).send('Project slug is required')
        }

        const path = restPath.length > 0 ? `/${restPath.join('/')}` : '/'
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
        return res.redirect(302, `http://${projectSlug}.localhost:8000${path}${query}`)
    }

    const subdomain = hostname.split('.')[0]

    // Custom Domain - DB Query

    const resolvesTo = `${BASE_PATH}/${subdomain}`

    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true })

})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'

})

proxy.on('error', (error, req, res) => {
    if (!res.headersSent) {
        res.status(502).send(`Proxy error: ${error.message}`)
    }
})

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))
