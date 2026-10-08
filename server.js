const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;

// Temporary verification challenges.
// Challenges expire after 15 minutes.
const pendingVerifications = new Map();

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

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "Sheriff Login Roblox Verification"
    });
});

// Find a Roblox account by username.
async function findRobloxUser(username) {
    const response = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(ROBLOX_API_KEY
                    ? { "x-api-key": ROBLOX_API_KEY }
                    : {})
            },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: false
            })
        }
    );

    if (!response.ok) {
        throw new Error("Roblox username lookup failed.");
    }

    const data = await response.json();

    return data.data?.[0] || null;
}

// STEP 1: Generate an ownership verification code.
app.post("/api/start-verification", async (req, res) => {
    try {
        const username = req.body?.username;

        if (
            typeof username !== "string" ||
            username.trim().length < 3 ||
            username.trim().length > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid Roblox username."
            });
        }

        const user = await findRobloxUser(username.trim());

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Roblox username not found."
            });
        }

        const code =
            "SHERIFF-" +
            crypto.randomBytes(4).toString("hex").toUpperCase();

        pendingVerifications.set(user.id, {
            code,
            expiresAt: Date.now() + 15 * 60 * 1000
        });

        res.json({
            success: true,
            username: user.name,
            userId: user.id,
            code,
            instructions:
                "Add this code to your Roblox profile description, then return here to verify ownership.",
            expiresInMinutes: 15
        });

    } catch (error) {
        console.error("Start verification error:", error);

        res.status(502).json({
            success: false,
            message: "Could not contact Roblox. Please try again."
        });
    }
});

// STEP 2: Check the code against the public Roblox profile.
app.post("/api/confirm-verification", async (req, res) => {
    try {
        const { userId, code } = req.body || {};

        if (
            !Number.isSafeInteger(userId) ||
            typeof code !== "string" ||
            code.length > 40
        ) {
            return res.status(400).json({
                verified: false,
                message: "Invalid verification request."
            });
        }

        const pending = pendingVerifications.get(userId);

        if (!pending || pending.code !== code) {
            return res.status(400).json({
                verified: false,
                message: "Verification code is invalid. Start again."
            });
        }

        if (Date.now() > pending.expiresAt) {
            pendingVerifications.delete(userId);

            return res.status(400).json({
                verified: false,
                message: "Your code expired. Start verification again."
            });
        }

        const response = await fetch(
            `https://users.roblox.com/v1/users/${userId}`
        );

        if (!response.ok) {
            return res.status(502).json({
                verified: false,
                message: "Could not read the Roblox profile. Try again."
            });
        }

        const profile = await response.json();

        if (
            typeof profile.description !== "string" ||
            !profile.description.includes(pending.code)
        ) {
            return res.json({
                verified: false,
                message:
                    "Code not found in your Roblox profile description. Add it and try again."
            });
        }

        pendingVerifications.delete(userId);

        res.json({
            verified: true,
            username: profile.name,
            displayName: profile.displayName,
            userId: profile.id
        });

    } catch (error) {
        console.error("Confirm verification error:", error);

        res.status(500).json({
            verified: false,
            message: "An unexpected error occurred."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Sheriff Login running on port ${PORT}`);
});
