const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;

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

        if (!username) {
            return res.status(400).json({
                verified: false,
                message: "Roblox username is required."
            });
        }

        if (!ROBLOX_API_KEY) {
            return res.status(500).json({
                verified: false,
                message: "Verification server is not configured."
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
                    usernames: [username],
                    excludeBannedUsers: false
                })
            }
        );

        if (!response.ok) {
            return res.status(502).json({
                verified: false,
                message: "Roblox could not be reached."
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

        console.error(error);

        res.status(500).json({
            verified: false,
            message: "An unexpected error occurred."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Sheriff Login server running on port ${PORT}`);
});
