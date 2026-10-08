const verifyButton = document.getElementById("verifyButton");
const usernameInput = document.getElementById("username");
const result = document.getElementById("result");

let verificationUserId = null;
let verificationCode = null;

verifyButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!username) {
        showResult("Please enter your Roblox username.", "error");
        return;
    }

    verifyButton.disabled = true;
    verifyButton.textContent = "Generating code...";

    try {
        const response = await fetch(
            "https://sheriff-erlc-log-in.onrender.com/api/start-verification",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not start verification.");
        }

        verificationUserId = data.userId;
        verificationCode = data.code;

        result.className = "result loading";
        result.innerHTML = `
            <h2>One more step!</h2>
            <p>We found your Roblox account: <strong>${escapeHTML(data.username)}</strong></p>
            <p>Add this code to your Roblox profile description:</p>
            <p style="font-size:22px;font-weight:bold;word-break:break-word">
                ${escapeHTML(data.code)}
            </p>
            <button id="copyCodeButton" type="button">Copy Code</button>
            <p>1. Open your Roblox profile and edit your About/description.</p>
            <p>2. Add the code above and save your profile.</p>
            <p>3. Return here and click the button below.</p>
            <button id="confirmButton" type="button">Verify Ownership</button>
        `;

        document.getElementById("copyCodeButton").addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(verificationCode);
                document.getElementById("copyCodeButton").textContent = "Copied!";
            } catch {
                showResult(
                    "Copy failed. Select and copy the code manually.",
                    "error"
                );
            }
        });

        document.getElementById("confirmButton").addEventListener("click", confirmOwnership);

    } catch (error) {
        console.error(error);
        showResult(
            error.message || "The verification server is currently unavailable.",
            "error"
        );
    } finally {
        verifyButton.disabled = false;
        verifyButton.textContent = "Verify Roblox Account";
    }
});

async function confirmOwnership() {
    if (!verificationUserId || !verificationCode) {
        showResult("Please start verification again.", "error");
        return;
    }

    const confirmButton = document.getElementById("confirmButton");
    confirmButton.disabled = true;
    confirmButton.textContent = "Checking profile...";

    try {
        const response = await fetch(
            "https://sheriff-erlc-log-in.onrender.com/api/confirm-verification",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: verificationUserId,
                    code: verificationCode
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Ownership check failed.");
        }

        if (data.verified) {
            showResult(`
                <div class="verified">
                    <div class="check">✓</div>
                    <h2>Ownership Verified!</h2>
                    <p><strong>${escapeHTML(data.username)}</strong> controls the account that displayed the code.</p>
                    <p class="roblox-id">Roblox ID: ${escapeHTML(String(data.userId))}</p>
                </div>
            `, "success");

            verificationUserId = null;
            verificationCode = null;
        } else {
            showResult(escapeHTML(data.message || "Code not found yet. Save it to your profile and try again."), "error");
        }

    } catch (error) {
        console.error(error);
        showResult(
            error.message || "The verification server is currently unavailable.",
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

function showResult(message, type) {
    result.className = `result ${type}`;
    result.innerHTML = message;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
