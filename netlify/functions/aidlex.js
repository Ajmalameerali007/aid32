export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const messages = body.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: "Missing 'messages'[]" };
    }

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // Use your saved Prompt (the agent) by ID:
        prompt: { id: "pmpt_68683b2a05b08194bb2989e8a23930a400dea87aa503adce" },
        messages
      })
    });

    const text = await resp.text();
    return {
      statusCode: resp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: text
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
}
