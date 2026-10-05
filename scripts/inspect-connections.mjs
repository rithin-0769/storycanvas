import { chromium } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const worlds = await fetch(`${baseURL}/api/worlds`).then((response) => response.json());
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
});

try {
  for (const world of worlds.slice(0, 4)) {
    await page.goto(`${baseURL}/world/${world.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => {
      const describe = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          class: element.getAttribute("class"),
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
          position: style.position,
          overflow: style.overflow,
          display: style.display,
          opacity: style.opacity,
          visibility: style.visibility,
          zIndex: style.zIndex,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          transform: style.transform,
        };
      };
      return {
        surface: describe(document.querySelector(".react-flow")),
        wrap: describe(document.querySelector(".flow-wrap")),
        viewport: describe(document.querySelector(".react-flow__viewport")),
        nodes: [...document.querySelectorAll(".react-flow__node")].map(describe),
        handles: [...document.querySelectorAll(".react-flow__handle")].slice(0, 4).map(describe),
        edgeLayer: describe(document.querySelector(".react-flow__edges")),
        edges: [...document.querySelectorAll(".react-flow__edge-path")].map((path) => ({ ...describe(path), d: path.getAttribute("d"), svg: describe(path.closest("svg")) })),
        labels: [...document.querySelectorAll(".react-flow__edge-text")].map((label) => label.textContent),
        stylesheets: [...document.styleSheets].map((sheet) => sheet.href),
      };
    });
    console.log(JSON.stringify({ world: world.title, savedNodes: world.canvas?.nodes?.length, savedEdges: world.canvas?.edges?.length, state, errors }, null, 2));
    if (process.env.SCREENSHOTS === "1") await page.screenshot({ path: `artifacts/connections-${world.id}.png`, fullPage: true });
  }
} finally {
  await browser.close();
}
