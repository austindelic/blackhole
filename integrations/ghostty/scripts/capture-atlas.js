// Playwright CLI run-code file. Serve the bundled BlackHoleCore as /core.js,
// its font at /DepartureMono-Regular.woff2, and canonical routes at /routes.json.
async (page) => {
  const data = await page.evaluate(async () => {
    const core = await import("/core.js");
    const routes = await fetch("/routes.json").then((r) => r.json());
    const route = routes["/"].idle[0];
    const face = new FontFace(
      "Departure Mono",
      "url(/DepartureMono-Regular.woff2)",
    );
    document.fonts.add(await face.load());
    const config = core.createGlyphAtlasConfig(
      core.createInitialControls({ textSize: 9 }),
    );
    const atlas = core.createGlyphAtlasRaster(config);
    return {
      config,
      camera: core.createInitialCamera({
        position: route.position,
        forward: route.forward,
      }),
      width: atlas.canvas.width,
      height: atlas.canvas.height,
      alpha: Array.from(
        atlas.canvas
          .getContext("2d")
          .getImageData(0, 0, atlas.canvas.width, atlas.canvas.height).data,
      ).filter((_, i) => i % 4 === 3),
      metrics: Array.from(
        atlas.metricsCanvas
          .getContext("2d")
          .getImageData(0, 0, config.glyphCount, 1).data,
      ),
    };
  });
  const download = page.waitForEvent("download");
  await page.evaluate((data) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );
    a.download = "glyph-atlas.json";
    a.click();
  }, data);
  await (await download).saveAs("integrations/ghostty/src/glyph-atlas.json");
};
