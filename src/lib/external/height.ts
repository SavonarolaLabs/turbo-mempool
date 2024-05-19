export async function fetchHeight() {
    try {
        const response = await fetch("https://api.ergoplatform.com/api/v1/info");
        const data = await response.json();
        return data.height;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}
