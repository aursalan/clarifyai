const API_BASE_URL = "https://clarifyai-server.aursalansayed.workers.dev";
// IMPORTANT: Replace this with the URL of the Hugging Face Space you create.
const PDF_EXTRACTOR_API_URL = "https://aursalan-pdfreader.hf.space/"; 

document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("pdfFile");
    const file = fileInput.files[0];
    if (!file) {
        return alert("Please upload a PDF file.");
    }

    // Show a loading indicator to the user
    document.getElementById("answer").textContent = "Processing PDF... this may take a moment.";
    
    try {
        // Step 1: Send the PDF to your Python backend for text extraction.
        console.log("Sending PDF to the extraction service...");
        const formData = new FormData();
        formData.append("file", file);

        const extractResponse = await fetch(PDF_EXTRACTOR_API_URL, {
            method: "POST",
            body: formData,
        });

        if (!extractResponse.ok) {
            throw new Error(`Failed to extract text from PDF. Status: ${extractResponse.status}`);
        }

        const extractedData = await extractResponse.json();
        const text = extractedData.text;
        console.log("Successfully extracted text from PDF.");

        // Step 2: Chunk the extracted text.
        const chunks = text.match(/.{1,500}/gs) || [];
        console.log(`Text split into ${chunks.length} chunks.`);

        // Step 3: Send the chunks to your Cloudflare Worker to be ingested.
        await fetch(`${API_BASE_URL}/api/ingest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chunks }),
        });

        alert("PDF processed and stored successfully! You can now ask questions.");
        document.getElementById("answer").textContent = "Your PDF has been processed. Ask a question about its content.";

    } catch (error) {
        console.error("An error occurred:", error);
        alert("An error occurred while processing the PDF. Please check the console for details.");
        document.getElementById("answer").textContent = "An error occurred. Please try again.";
    }
});

document.getElementById("askBtn").addEventListener("click", async () => {
    const q = document.getElementById("question").value;
    if (!q) {
        return alert("Please enter a question.");
    }
    
    // Show a loading indicator
    document.getElementById("answer").textContent = "Thinking...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q }),
        });

        if (!res.ok) {
            throw new Error(`Query failed. Status: ${res.status}`);
        }

        const data = await res.json();
        document.getElementById("answer").textContent = data.answer;

    } catch (error) {
        console.error("An error occurred during query:", error);
        alert("An error occurred while asking the question. Please check the console for details.");
        document.getElementById("answer").textContent = "An error occurred. Please try again.";
    }
});