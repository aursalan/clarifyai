export default {
	async fetch(req, env) {
	  const url = new URL(req.url);
  
	  if (url.pathname === "/api/ingest" && req.method === "POST") {
		const { chunks } = await req.json();
		for (const chunk of chunks) {
		  const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: chunk });
		  await env.VECTORIZE.upsert([
			{ id: crypto.randomUUID(), values: embedding.data[0], metadata: { text: chunk } }
		  ]);
		}
		return Response.json({ status: "ok" });
	  }
  
	  if (url.pathname === "/api/query" && req.method === "POST") {
		const { question } = await req.json();
		const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: question });
  
		const results = await env.VECTORIZE.query(embedding.data[0], { topK: 3 });
		const context = results.matches.map(m => m.metadata.text).join("\n");
  
		const completion = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
		  messages: [
			{ role: "system", content: "Answer based only on the provided context. Cite sources." },
			{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }
		  ]
		});
  
		return Response.json({ answer: completion.response, sources: results.matches });
	  }
  
	  return new Response("Not Found", { status: 404 });
	}
  };
  