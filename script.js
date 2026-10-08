const API_URL = "https://sheriff-erlc-log-in.onrender.com";

const verifyButton = document.getElementById("verifyButton");
const usernameInput = document.getElementById("username");
const result = document.getElementById("result");

let currentUserId = null;
let currentCode = null;

verifyButton.addEventListener("click", startVerification);

async function startVerification() {
    const username = usernameInput.value.trim();

    if (!username) {
        showMessage("Please enter your Roblox username.", "error");
        return;
    }

    setLoading(true, "Finding Roblox account...");
    showMessage("Contacting Sheriff Login server...", "loading");

    try {
        const response = await fetch(`${API_URL}/api/start-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || `Server returned ${response.status}`);
        }

        currentUserId = data.userId;
        currentCode = data.code;

        result.className = "result loading";
        result.innerHTML = `
            <h2>One more step!</h2>
            <p>Account found: <strong>${escapeHTML(data.username)}</strong></p>
            <p>Add this code to your Roblox profile description:</p>
            <p id="verificationCode" style="font-size:22px;font-weight:bold;overflow-wrap:anywhere">
                ${escapeHTML(data.code)}
            </p>
            <button id="copyCodeButton" type="button">Copy Code</button>
            <p>1. Open your Roblox profile.</p>
            <p>2. Edit your profile's About/description and add the code.</p>
            <p>3. Save your profile, return here, and verify.</p>
            <button id="confirmButton" type="button">Verify Ownership</button>
        `;

        document.getElementById("copyCodeButton").addEventListener("click", copyCode);
        document.getElementById("confirmButton").addEventListener("click", confirmOwnership);

    } catch (error) {
        console.error("Start verification error:", error);
        showMessage(
            `Could not start verification: ${error.message}. Check the server and try again.`,
            "error"
        );
    } finally {
        setLoading(false);
    }
}

async function copyCode() {
    try {
        await navigator.clipboard.writeText(currentCode);
        document.getElementById("copyCodeButton").textContent = "Copied!";
    } catch {
        showMessage("Copy failed. Select the code and copy it manually.", "error");
    }
}

async function confirmOwnership() {
    if (!currentUserId || !currentCode) {
        showMessage("Start verification again to get a new code.", "error");
        return;
    }

    const confirmButton = document.getElementById("confirmButton");
    confirmButton.disabled = true;
    confirmButton.textContent = "Checking profile...";

    try {
        const response = await fetch(`${API_URL}/api/confirm-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: currentUserId,
                code: currentCode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Server returned ${response.status}`);
        }

        if (data.verified) {
            showMessage(`
                <div class="verified">
                    <div class="check">✓</div>
                    <h2>Ownership Verified!</h2>
                    <p><strong>${escapeHTML(data.username)}</strong> proved control of the Roblox profile.</p>
                    <p class="roblox-id">Roblox ID: ${escapeHTML(String(data.userId))}</p>
                </div>
            `, "success");

            currentUserId = null;
            currentCode = null;
        } else {
            showMessage(escapeHTML(data.message || "Code not found yet. Save it to your profile and try again."), "error");
        }

    } catch (error) {
        console.error("Confirm verification error:", error);
        showMessage(
            `Could not check ownership: ${error.message}. Please try again.`,
            "error"
        );
    } finally {
        const button = document.getElementById("confirmButton");
        if (button) {
            button.disabled = false;
            button.textContent = "Verify Ownership";
        }
    }
}

function showMessage(message, type) {
    result.className = `result ${type}`;
    result.innerHTML = message;
}

function setLoading(loading, text = "Verify Roblox Account") {
    verifyButton.disabled = loading;
    verifyButton.textContent = loading ? text : "Verify Roblox Account";
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
