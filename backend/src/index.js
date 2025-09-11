// --- NEW: Define a list of allowed origins ---
const allowedOrigins = [
	"https://clarifyai.pages.dev", // Your production frontend URL
	"http://127.0.0.1:5501",       // A common local dev server port
	"http://localhost:5500",
	// Add any other ports you might use for local development
  ];
  
  export default {
	async fetch(req, env) {
	  // --- Check the request's origin ---
	  const origin = req.headers.get("Origin");
	  const allowedOrigin = allowedOrigins.includes(origin) ? origin : null;
  
	  // Helper to add CORS headers
	  const corsResponse = (response) => {
		if (allowedOrigin) {
		  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
		  response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
		  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
		}
		return response;
	  };
  
	  // Handle CORS preflight
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
		  return new Response("CORS preflight check failed", { status: 403 });
		}
	  }
  
	  const url = new URL(req.url);
  
	  // --- Ingest API ---
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
		  console.log(`Chunk content preview: "${chunk.substring(0, 150)}..."`);
  
		  try {
			// Generate embedding
			const embeddingResult = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: chunk });
			const values = embeddingResult.data[0];
  
			if (!values || values.length === 0) {
			  console.error(`ERROR: Failed to generate embedding for chunk ${i + 1}. Skipping.`);
			  continue;
			}
			console.log(`2. Embedding generated successfully (dimensions: ${values.length}).`);
  
			// Store vector (flatten metadata to avoid being dropped)
			const vector = {
			  id: crypto.randomUUID(),
			  values,
			  metadata: {
				text: String(chunk), // ✅ ensure plain string
			  },
			};
  
			console.log("VECTOR OBJECT BEFORE UPSERT:", JSON.stringify(vector, null, 2));
  
			await env.VECTORIZE.upsert([vector]);
			console.log(`3. Successfully stored vector for chunk ${i + 1}.`);
		  } catch (error) {
			console.error(`An error occurred while processing chunk ${i + 1}:`, error);
		  }
		}
  
		console.log("\n--- Ingestion process complete. ---");
		return corsResponse(Response.json({ status: "ok" }));
	  }
  
	  // --- Query API ---
	  if (url.pathname === "/api/query" && req.method === "POST") {
		console.log("Received a query request...");
		const { question } = await req.json();
		console.log(`1. Question received: "${question}"`);
  
		// Embed the question
		const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: question });
  
		// Query vector DB
		const results = await env.VECTORIZE.query(embedding.data[0], {
		  topK: 7,
		  returnMetadata: "all", // ✅ request metadata
		});
  
		console.log("2. RAW query results:", JSON.stringify(results));
  
		// Extract context
		const context = results.matches
		  .map((m) => m.metadata?.text)
		  .filter(Boolean)
		  .join("\n\n---\n\n");
  
		console.log("3. Context:", context);
  
		// System + user prompts
		const systemPrompt = `You are an expert Q&A assistant. Your task is to answer the user's question based *only* on the provided context snippets.
  - You MUST use *only* the information from the provided context.
  - Do not use any outside knowledge. Do not make up any information, names, or details.
  - If the answer is not present in the context, you MUST explicitly state: 'The provided context does not contain the answer to this question.'`;
  
		const userPrompt = `Based on the following context snippets, please answer the question.
  
  Context Snippets:
  ${context}
  
  ---
  Question: ${question}`;
  
		// Call LLM
		const completion = await env.AI.run("@cf/mistral/mistral-7b-instruct-v0.1", {
		  messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		  ],
		});
  
		console.log("4. Final synthesized answer:", completion.response);
  
		return corsResponse(Response.json({ answer: completion.response }));
	  }
  
	  // --- Default 404 ---
	  return corsResponse(new Response("Not Found", { status: 404 }));
	},
  };
  