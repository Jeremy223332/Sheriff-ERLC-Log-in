const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;

app.use(express.json());


// ================================
// BASIC SERVER TEST
// ================================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "Sheriff Login Roblox Verification"
    });
});


// ================================
// ROBLOX VERIFICATION
// ================================

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
            console.error("ROBLOX_API_KEY is missing.");

            return res.status(500).json({
                verified: false,
                message: "Verification server is not configured."
            });
        }


        // Look up the Roblox username
        const userResponse = await fetch(
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


        if (!userResponse.ok) {

            console.error(
                "Roblox API error:",
                userResponse.status
            );

            return res.status(502).json({
                verified: false,
                message: "Roblox could not be reached."
            });
        }


        const data = await userResponse.json();


        if (!data.data || data.data.length === 0) {

            return res.status(404).json({
                verified: false,
                message: "That Roblox username was not found."
            });
        }


        const user = data.data[0];


        return res.json({
            verified: true,
            username: user.name,
            displayName: user.displayName,
            userId: user.id
        });


    } catch (error) {

        console.error("Verification error:", error);

        return res.status(500).json({
            verified: false,
            message: "An unexpected verification error occurred."
        });

    }

});


app.listen(PORT, () => {

    console.log(
        `Sheriff Login server running on port ${PORT}`
    );

});
