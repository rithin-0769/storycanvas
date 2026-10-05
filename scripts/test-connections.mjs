import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const temporaryWorlds = [];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" || /couldn.t create edge|needs a width and a height/i.test(message.text())) errors.push(message.text());
});

async function api(path, options) {
  const response = await fetch(`${baseURL}${path}`, options);
  assert.ok(response.ok, `${path}: HTTP ${response.status}`);
  return response.json();
}

async function newWorld(title, canvas) {
  const world = await api("/api/worlds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, genre: "Test" }) });
  temporaryWorlds.push(world.id);
  if (canvas) await api(`/api/worlds/${world.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ canvas }) });
  return world;
}

async function waitForSaved(id, predicate) {
  await expect.poll(async () => predicate((await api(`/api/worlds/${id}`)).canvas), { timeout: 15000 }).toBe(true);
}

async function verifyMap(expectedEdges, label) {
  await expect(page.locator(".react-flow__edge-path")).toHaveCount(expectedEdges);
  await expect.poll(async () => page.locator(".react-flow").evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(180);
  await page.waitForTimeout(650);
  const state = await page.evaluate(() => {
    const map = document.querySelector(".react-flow").getBoundingClientRect();
    return {
      width: map.width,
      height: map.height,
      y: map.y,
      paths: [...document.querySelectorAll(".react-flow__edge-path")].map((path) => ({
        length: path.getTotalLength(),
        stroke: getComputedStyle(path).stroke,
        width: parseFloat(getComputedStyle(path).strokeWidth),
        opacity: getComputedStyle(path).opacity,
        vectorEffect: path.getAttribute("vector-effect"),
        overflow: getComputedStyle(path.closest("svg")).overflow,
        marker: path.getAttribute("marker-end"),
      })),
      handles: [...document.querySelectorAll(".react-flow__handle")].map((handle) => ({ opacity: getComputedStyle(handle).opacity, width: handle.offsetWidth })),
      labels: [...document.querySelectorAll(".connection-label")].map((label) => ({ fontSize: getComputedStyle(label).fontSize, width: label.getBoundingClientRect().width })),
    };
  });
  assert.ok(state.height > 500, `${label}: canvas height`);
  assert.equal(state.y, 61, `${label}: canvas stays below the header`);
  assert.equal(state.paths.length, expectedEdges);
  for (const path of state.paths) {
    assert.ok(path.length > 0, `${label}: path geometry`);
    assert.ok(path.stroke !== "none" && path.opacity === "1", `${label}: visible path`);
    assert.ok(path.width >= 3, `${label}: strong line contrast`);
    assert.equal(path.vectorEffect, "non-scaling-stroke", `${label}: zoom-independent line width`);
    assert.equal(path.overflow, "visible", `${label}: no SVG clipping`);
    assert.ok(path.marker?.startsWith("url("), `${label}: direction arrow`);
  }
  for (const handle of state.handles) assert.ok(handle.opacity === "1" && handle.width >= 10, `${label}: visible handles`);
  assert.equal(state.labels.length, expectedEdges, `${label}: each connection has a readable label`);
  for (const routeLabel of state.labels) assert.equal(routeLabel.fontSize, "11px", `${label}: label size`);
  console.log(`PASS ${label}: ${Math.round(state.width)}px canvas, ${expectedEdges} visible connections`);
}

try {
  const existingWorlds = await api("/api/worlds");
  for (const width of [1366, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const world of existingWorlds.filter((item) => item.canvas?.nodes?.length).slice(0, 4)) {
      await page.goto(`${baseURL}/world/${world.id}`, { waitUntil: "networkidle" });
      await verifyMap(world.canvas.edges.length, `${world.title} at ${width}px`);
    }
  }

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const first = existingWorlds.find((world) => world.canvas?.nodes?.length);
  if (first) {
    await page.locator(`.cover-art[href="/world/${first.id}"]`).click();
    await verifyMap(first.canvas.edges.length, "Dashboard client-side navigation");
  }

  const templateWorld = await newWorld(`Connection regression ${Date.now()}`);
  await page.goto(`${baseURL}/world/${templateWorld.id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Classic Fantasy Realm/ }).click();
  await verifyMap(6, "Fantasy template");
  await waitForSaved(templateWorld.id, (canvas) => canvas.nodes.length === 6 && canvas.edges.length === 6);
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await page.getByRole("button", { name: /Surprise me/ }).click();
  await verifyMap(11, "Quick-fill appended without overlapping the original template");
  await waitForSaved(templateWorld.id, (canvas) => canvas.nodes.length === 12 && canvas.edges.length === 11);

  await page.getByRole("button", { name: "Show connections", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Canvas connections" }).getByRole("button")).toHaveCount(11);
  await page.getByLabel("Connection type", { exact: true }).selectOption("river");
  await page.getByLabel("Route name (optional)").fill("Silverwater Run");
  await page.getByRole("button", { name: "Add connection", exact: true }).click();
  await verifyMap(12, "Create connection from the panel");
  await page.getByLabel("Connection name", { exact: true }).fill("Silverwater Accord");
  await page.getByLabel("Relationship type", { exact: true }).selectOption("alliance");
  await waitForSaved(templateWorld.id, (canvas) => canvas.edges.some((edge) => edge.label === "Silverwater Accord" && edge.data?.kind === "alliance"));
  await page.reload({ waitUntil: "networkidle" });
  await verifyMap(12, "Edited connections survive reload");
  await page.getByRole("button", { name: "Show connections", exact: true }).click();
  await page.getByRole("navigation", { name: "Canvas connections" }).getByRole("button", { name: /Silverwater Accord/ }).click();
  await page.getByRole("button", { name: "Delete connection", exact: true }).click();
  await verifyMap(11, "Delete a selected connection");
  await waitForSaved(templateWorld.id, (canvas) => canvas.edges.length === 11 && !canvas.edges.some((edge) => edge.label === "Silverwater Accord"));

  const dragWorld = await newWorld(`Handle regression ${Date.now()}`, {
    nodes: [
      { id: "test-a", type: "story", position: { x: 100, y: 180 }, data: { label: "Test City", subtitle: "City", type: "city" } },
      { id: "test-b", type: "story", position: { x: 550, y: 180 }, data: { label: "Test Port", subtitle: "Port", type: "port" } },
    ], edges: [],
  });
  await page.goto(`${baseURL}/world/${dragWorld.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const from = page.locator('.react-flow__node[data-id="test-a"] [data-handleid="out"]');
  const to = page.locator('.react-flow__node[data-id="test-b"] [data-handleid="in"]');
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  assert.ok(a && b);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 16 });
  await page.mouse.up();
  await verifyMap(1, "Draw connection by dragging between handles");
  await waitForSaved(dragWorld.id, (canvas) => canvas.edges.length === 1);
  await page.reload({ waitUntil: "networkidle" });
  await verifyMap(1, "Dragged connection survives reload");
  await page.locator('.react-flow__node[data-id="test-b"] [data-handleid="out"]').click();
  await page.locator('.react-flow__node[data-id="test-a"] [data-handleid="in"]').click();
  await verifyMap(2, "Draw a second connection by clicking handles");
  await waitForSaved(dragWorld.id, (canvas) => canvas.edges.length === 2);

  for (const width of [900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await verifyMap(2, `Resize an open canvas to ${width}px`);
  }
  await page.getByRole("button", { name: "Show connections", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Canvas connections" }).getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Close inspector" })).toBeVisible();
  await page.getByRole("button", { name: "Close inspector" }).click();
  await verifyMap(2, "Mobile map remains visible after closing inspector");
  if (process.env.SCREENSHOTS === "1") await page.screenshot({ path: "artifacts/connections-fixed-mobile.png", fullPage: true });
  assert.deepEqual(errors, [], "No browser or React Flow connection errors");
  console.log("PASS All connection rendering, creation, and persistence tests");
} finally {
  await browser.close();
  for (const id of temporaryWorlds) await fetch(`${baseURL}/api/worlds/${id}`, { method: "DELETE" });
}
