const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "Sheriff Login Roblox Verification"
    });
});

app.post("/api/verify", async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || typeof username !== "string") {
            return res.status(400).json({
                verified: false,
                message: "Please enter a Roblox username."
            });
        }

        if (!ROBLOX_API_KEY) {
            return res.status(500).json({
                verified: false,
                message: "Server API key is not configured."
            });
        }

        const response = await fetch(
            "https://users.roblox.com/v1/usernames/users",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ROBLOX_API_KEY
                },
                body: JSON.stringify({
                    usernames: [username.trim()],
                    excludeBannedUsers: false
                })
            }
        );

        if (!response.ok) {
            console.error("Roblox API status:", response.status);

            return res.status(502).json({
                verified: false,
                message: "Roblox account lookup failed. Please try again."
            });
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            return res.status(404).json({
                verified: false,
                message: "That Roblox username was not found."
            });
        }

        const user = data.data[0];

        res.json({
            verified: true,
            username: user.name,
            displayName: user.displayName,
            userId: user.id
        });

    } catch (error) {
        console.error("Verification error:", error);

        res.status(500).json({
            verified: false,
            message: "An unexpected server error occurred."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Sheriff Login server running on port ${PORT}`);
});
