const verifyButton = document.getElementById("verifyButton");
const usernameInput = document.getElementById("username");
const result = document.getElementById("result");

verifyButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!username) {
        showResult("Please enter your Roblox username.", "error");
        return;
    }

    verifyButton.disabled = true;
    verifyButton.textContent = "Checking...";

    showResult("Looking up your Roblox account...", "loading");

    try {
        const response = await fetch(
            "https://sheriff-erlc-log-in.onrender.com/api/verify",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Verification failed."
            );
        }

        if (data.verified) {
            showResult(
                `
                <div class="verified">
                    <div class="check">✓</div>

                    <h2>Roblox Verified!</h2>

                    <p>
                        <strong>${escapeHTML(data.username)}</strong>
                        has been verified.
                    </p>

                    <p class="roblox-id">
                        Roblox ID: ${escapeHTML(String(data.userId))}
                    </p>
                </div>
                `,
                "success"
            );
        } else {
            showResult(
                data.message || "We couldn't verify this account.",
                "error"
            );
        }

    } catch (error) {

        console.error(error);

        showResult(
            "The verification server is currently unavailable.",
            "error"
        );

    } finally {

        verifyButton.disabled = false;
        verifyButton.textContent = "Verify Roblox Account";

    }
});


function showResult(message, type) {

    result.className = `result ${type}`;

    result.innerHTML = message;

}


function escapeHTML(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
