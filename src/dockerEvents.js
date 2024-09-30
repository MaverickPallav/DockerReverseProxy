module.exports = (docker, db) => {
    docker.getEvents(function (err, stream) {
        if (err) {
            console.log('Error in getting events', err);
            return;
        }

        stream.on("data", async (chunk) => {
            if (!chunk) return;

            try {
                const event = JSON.parse(chunk.toString());

                if (event.Type === "container" && event.Action == "start") {
                    // Pull up for container
                    const container = docker.getContainer(event.id);
                    const containerInfo = await container.inspect();
                    const containerName = containerInfo.Name.substring(1);
                    const ipAddress = containerInfo.NetworkSettings.IPAddress;

                    const exposedPort = Object.keys(containerInfo.Config.ExposedPorts);
                    let defaultPort = null;

                    if (exposedPort && exposedPort.length > 0) {
                        const [port, type] = exposedPort[0].split("/");
                        
                        if (type === "tcp") {
                            defaultPort = port;
                        }
                    }

                    console.log(`Registering ${containerName}.localhost -> http://${ipAddress}`);

                    db.set(containerName, { containerName, ipAddress, defaultPort });
                }
            } catch (error) {
                console.error('Error processing event:', error);
            }
        });
    });
};
