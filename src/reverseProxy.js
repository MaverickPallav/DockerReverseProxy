const http = require("http");

module.exports = (proxy, db) => {
    const express = require("express");
    const reverseProxyApp = express();

    // Middleware to handle regular HTTP requests
    reverseProxyApp.use(function (req, res) {
        const hostname = req.hostname;
        const subdomain = hostname.split(".")[0];

        if (!db.has(subdomain)) return res.status(404).end();

        const { ipAddress, defaultPort } = db.get(subdomain);
        const target = `http://${ipAddress}:${defaultPort}`;

        console.log(`Forwarding ${hostname} → ${target}`);
        return proxy.web(req, res, { target, changeOrigin: true, ws: true });
    });

    // Create the reverse proxy server
    const reverseProxy = http.createServer(reverseProxyApp);
    
    // Handle WebSocket upgrades
    reverseProxy.on('upgrade', (req, socket, head) => {
        const hostname = req.headers.host;
        const subdomain = hostname.split(".")[0];

        if (!db.has(subdomain)) return socket.end(); // End the socket if subdomain is not found

        const { ipAddress, defaultPort } = db.get(subdomain);
        const target = `http://${ipAddress}:${defaultPort}`;

        return proxy.ws(req, socket, head, {
            target: target,
            ws: true,
        });
    });
    
    return reverseProxy;
};
