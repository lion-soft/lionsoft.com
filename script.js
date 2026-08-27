document.addEventListener("DOMContentLoaded", () => {

    const menu = document.querySelector(".menu");
    const links = document.querySelector(".links");

    menu?.addEventListener("click", () => {
        links.classList.toggle("open");
    });

    document.querySelectorAll(".form").forEach(form => {

        form.addEventListener("submit", async (e) => {

            e.preventDefault();

            const button = form.querySelector("button");
            const oldText = button.textContent;

            button.textContent = "Sending...";
            button.disabled = true;

            try {

                const response = await fetch(form.action, {
                    method: "POST",
                    body: new FormData(form),
                    headers: {
                        "Accept": "application/json"
                    }
                });

                if (response.ok) {

                    button.textContent = "✓ Message Sent";
                    form.reset();

                } else {

                    button.textContent = "✕ Failed to Send";

                }

            } catch (error) {

                button.textContent = "✕ Failed to Send";

            }

            setTimeout(() => {
                button.textContent = oldText;
                button.disabled = false;
            }, 2200);

        });

    });

});