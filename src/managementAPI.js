module.exports = (docker, db) => {
    const express = require("express");
    const managementAPI = express();

    managementAPI.use(express.json());

    managementAPI.post("/containers", async (req, res) => {
        const { image, tag = "latest" } = req.body;
        let imageAlreadyExists = false;

        try {
            // Check if the image already exists on the system
            const images = await docker.listImages();
            for (const systemImage of images) {
                for (const systemTag of systemImage.RepoTags) {
                    if (systemTag === `${image}:${tag}`) {
                        imageAlreadyExists = true;
                        break;
                    }
                }
                if (imageAlreadyExists) break;
            }

            // Pull image if it doesn't exist
            if (!imageAlreadyExists) {
                console.log(`Pulling Image: ${image}:${tag}`);
                await docker.pull(`${image}:${tag}`);
            }

            // Create and start the container
            const container = await docker.createContainer({
                Image: `${image}:${tag}`,
                Tty: false,
                HostConfig: {
                    AutoRemove: true,
                },
            });

            await container.start();

            // Respond with container details
            return res.json({
                status: "success",
                container: `${(await container.inspect()).Name}.localhost`.split('/')[1],
            });
        } catch (error) {
            console.error("Error creating container:", error);
            return res.status(500).json({ status: "error", message: error.message });
        }
    });

    managementAPI.post("/containers/stop", async (req, res) => {
        const { containerName } = req.body;

        try {
            // Get the container by its name
            const container = docker.getContainer(containerName);

            // Check if the container exists and is running
            const containerInfo = await container.inspect();
            if (!containerInfo.State.Running) {
                return res.status(400).json({
                    status: "error",
                    message: `Container ${containerName} is not running.`,
                });
            }

            // Stop the container
            await container.stop();

            return res.json({
                status: "success",
                message: `Container ${containerName} stopped successfully.`,
            });
        } catch (error) {
            console.error("Error stopping container:", error);
            return res.status(500).json({ status: "error", message: error.message });
        }
    });

    return managementAPI;
};
