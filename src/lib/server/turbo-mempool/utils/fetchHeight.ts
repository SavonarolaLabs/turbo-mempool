export async function fetchHeight() {
    try {
        const response = await fetch("https://api.ergoplatform.com/api/v1/info");
        const data = await response.json();
        return data.height; // Extracting the height value from the JSON response
    } catch (error) {
        console.error("Error fetching data:", error);
        return null; // In case of an error, return null
    }
}
