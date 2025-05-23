document.getElementById("shorten-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const url = formData.get("url");
    const shortCode = formData.get("shortCode");

    try {
        const response = await fetch("/shorten", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, shortCode })
        });

        if (response.ok) {
            const result = await response.json();
            alert("URL shortened successfully!");

            const list = document.getElementById("shortened-urls");
            const item = document.createElement("li");
            item.textContent = `http://localhost:3002/s/${result.shortCode}`;
            list.appendChild(item);
            event.target.reset();
        } else {
            const errorMessage = await response.text();
            alert(errorMessage);
        }
    } catch (error) {
        alert("Something went wrong!");
        console.error(error);
    }
});

   



