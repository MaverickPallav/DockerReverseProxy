const Docker = require("dockerode");
const httpProxy = require("http-proxy");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const proxy = httpProxy.createProxy({});
const db = new Map();

const managementAPI = require('./managementAPI')(docker, db);
const reverseProxy = require('./reverseProxy')(proxy, db);
const dockerEvents = require('./dockerEvents')(docker, db);

managementAPI.listen(8080, () => {
    console.log('Management API is running on PORT 8080');
});

reverseProxy.listen(80, () => {
    console.log('Reverse Proxy is running on PORT 80');
});
