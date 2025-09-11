async function extractText(file) {
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; // pdfjsLib comes from script tag
	let text = "";
  
	for (let i = 1; i <= pdf.numPages; i++) {
	  const page = await pdf.getPage(i);
	  const content = await page.getTextContent();
	  text += content.items.map(item => item.str).join(" ") + "\n";
	}
	return text;
  }
  
  document.getElementById("uploadBtn").addEventListener("click", async () => {
	const file = document.getElementById("pdfFile").files[0];
	if (!file) return alert("Please upload a PDF");
  
	const text = await extractText(file);
	const chunks = text.match(/.{1,500}/g) || [];
  
	await fetch("/api/ingest", {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ chunks })
	});
  
	alert("PDF processed and stored!");
  });
  
  document.getElementById("askBtn").addEventListener("click", async () => {
	const q = document.getElementById("question").value;
	const res = await fetch("/api/query", {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ question: q })
	});
  
	const data = await res.json();
	document.getElementById("answer").textContent = data.answer;
  });
  