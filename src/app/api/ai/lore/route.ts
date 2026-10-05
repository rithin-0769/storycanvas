type LoreNode = {
  label?: string;
  subtitle?: string;
  type?: string;
  climate?: string;
  population?: string;
  ruler?: string;
  description?: string;
};

const encoder = new TextEncoder();

function demoLore(node: LoreNode) {
  const name = node.label || "this unnamed place";
  const ruler = node.ruler && node.ruler !== "None" ? node.ruler : "those who remember its oldest secrets";
  return `### The Chronicle of ${name}\n\n${name} was not founded so much as **discovered**—already old when the first road reached its borders. ${node.description || "Its true beginnings survive only in weathered songs and disputed maps."}\n\nUnder the watch of ${ruler}, daily life is shaped by a ${node.climate?.toLowerCase() || "changeable"} climate and traditions passed down in guarded fragments. Travelers know the place by the copper bells sounded at dusk, when every doorway is marked with a line of salt and ash.\n\n#### A secret worth keeping\n\nBeneath the oldest foundation lies a sealed chamber called the *Quiet Archive*. Once each generation, its door opens for a single night. No two witnesses agree on what waits inside—but every account mentions a map whose borders slowly redraw themselves.\n\n**Story thread:** A courier has arrived carrying a key engraved with ${name}'s lost crest, while three rival factions each claim it belongs to them.`;
}

function streamDemo(text: string) {
  const chunks = text.match(/[\s\S]{1,18}(?:\s|$)/g) ?? [text];
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 24));
      }
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const node: LoreNode = body.node ?? {};
  const customPrompt = typeof body.prompt === "string" ? body.prompt.slice(0, 1000) : "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(streamDemo(demoLore(node)), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const prompt = `You are a gifted fantasy and science-fiction worldbuilding editor. Write atmospheric, usable lore for an author's world map. Use markdown with a short title, 2-3 vivid paragraphs, one hidden secret, and one story hook. Avoid generic filler.\n\nEntity: ${node.label}\nType: ${node.subtitle || node.type}\nClimate: ${node.climate || "Unknown"}\nPopulation: ${node.population || "Unknown"}\nRuler: ${node.ruler || "Unknown"}\nExisting notes: ${node.description || "None"}\nAuthor direction: ${customPrompt || "Expand this location naturally."}`;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 900,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text();
    return Response.json({ error: "Lore generation failed", detail: detail.slice(0, 300) }, { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                controller.enqueue(encoder.encode(event.delta.text));
              }
            } catch { /* ignore keepalive and partial events */ }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
