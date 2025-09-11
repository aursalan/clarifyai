// --- NEW: Define a list of allowed origins ---
const allowedOrigins = [
	"https://clarifyai.pages.dev", // Your production frontend URL
	"http://127.0.0.1:5500",             // A common local dev server port
	"http://localhost:5500",
	// Add any other ports you might use for local development
  ];
  
  export default {
	async fetch(req, env) {
	  // --- NEW: Check the request's origin ---
	  const origin = req.headers.get("Origin");
	  const allowedOrigin = allowedOrigins.includes(origin) ? origin : null;
  
	  // A helper function to add CORS headers to a response
	  const corsResponse = (response) => {
		// If the origin is not allowed, we don't add the header
		if (allowedOrigin) {
		  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
		  response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
		  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
		}
		return response;
	  };
	  
	  // Handle CORS preflight requests
	  if (req.method === "OPTIONS") {
		if (allowedOrigin) {
		  return new Response(null, {
			headers: {
			  "Access-Control-Allow-Origin": allowedOrigin,
			  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
			  "Access-Control-Allow-Headers": "Content-Type",
			},
		  });
		} else {
		  // Deny the preflight request if the origin is not allowed
		  return new Response("CORS preflight check failed", { status: 403 });
		}
	  }
  
	  // --- The rest of your API logic remains the same, but uses the corsResponse helper ---
  
	  const url = new URL(req.url);
  
	  if (url.pathname === "/api/ingest" && req.method === "POST") {
		console.log("Received an ingest request...");
		const { chunks } = await req.json();
  
		if (!chunks || chunks.length === 0) {
		  console.error("ERROR: No chunks were received from the frontend.");
		  return corsResponse(new Response("No chunks to process", { status: 400 }));
		}
  
		console.log(`1. Received ${chunks.length} chunks to process from the PDF.`);
  
		for (let i = 0; i < chunks.length; i++) {
		  const chunk = chunks[i];
		  console.log(`\n--- Processing chunk ${i + 1} of ${chunks.length} ---`);
		  // Log a preview of the chunk to make sure it's not empty or malformed
		  console.log(`Chunk content preview: "${chunk.substring(0, 150)}..."`);
  
		  try {
			// Generate embedding for the chunk
			const embeddingResult = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: chunk });
			const values = embeddingResult.data[0];
			
			if (!values || values.length === 0) {
			  console.error(`ERROR: Failed to generate embedding for chunk ${i + 1}. Skipping.`);
			  continue; // Skip to the next chunk
			}
			console.log(`2. Embedding generated successfully (dimensions: ${values.length}).`);
  
			// Prepare the object to be stored
			const vector = {
			  id: crypto.randomUUID(),
			  values: values,
			  metadata: { text: chunk }
			};
			
			// Store the vector in the database
			await env.VECTORIZE.upsert([vector]);
			console.log(`3. Successfully stored vector for chunk ${i + 1} in the database.`);
  
		  } catch (error) {
			console.error(`An error occurred while processing chunk ${i + 1}:`, error);
		  }
		}
  
		console.log("\n--- Ingestion process complete. ---");
		return corsResponse(Response.json({ status: "ok" }));
	  }
  
	  if (url.pathname === "/api/query" && req.method === "POST") {
		// ... (your query logic) ...
		console.log("Received a query request...");
		const { question } = await req.json();
		console.log(`1. Question received: "${question}"`);
		const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: question });
		const results = await env.VECTORIZE.query(embedding.data[0], { topK: 7 });
		console.log("2. Vector search results:", JSON.stringify(results, null, 2));
		const context = results.matches
        .map(m => m.metadata?.text)
        .filter(Boolean)
        .join("\n\n---\n\n"); // Using a separator for clarity
      
		  // --- CHANGE 2: Use a "Synthesis" Prompt ---
		  // This new prompt structure guides the LLM to act as an analyst.
		  const systemPrompt = `You are a helpful AI assistant. Your task is to analyze the provided context, which consists of several text snippets from a larger document. Synthesize the information from these snippets to answer the user's question accurately and completely. If the context does not contain the answer, state that clearly. Do not make up information. Combine relevant details from all snippets into a single, coherent response.`;

		  const userPrompt = `Based on the following context snippets, please answer the question.Context Snippets:${context}---Question: ${question}`;

		  const completion = await env.AI.run("@cf/mistral/mistral-7b-instruct-v0.1", {
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt }
			]
		});
		console.log("4. Final synthesized answer from LLM:", completion.response);
    return corsResponse(Response.json({ answer: completion.response }));
	  }
  
	  return corsResponse(new Response("Not Found", { status: 404 }));
	}
  };