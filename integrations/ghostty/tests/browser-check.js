async (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(request.url()));
  await page.goto("http://127.0.0.1:4330/");
  await page.waitForFunction(() => window.harnessReady);
  const results = await page.evaluate(async () => {
    const first = await renderGhostty(1512, 951, false, 0);
    const second = await renderGhostty(1512, 951, false, 0);
    const text = await renderGhostty(1512, 951, true, 0);
    const retina = await renderGhostty(3024, 1902, true, 0);
    if (first.diskBright < 1500)
      throw Error(`Central disk missing/dim: ${first.diskBright}`);
    if (first.brightPixels < 50000) throw Error("Scene is unexpectedly empty");
    if (
      first.diskBright !== second.diskBright ||
      first.brightPixels !== second.brightPixels
    )
      throw Error("Fixed-time render is unstable");
    for (const frame of [text, retina])
      if (frame.foreground < 10000 || frame.badForeground !== 0)
        throw Error("Terminal foreground was modified");
    return { first, second, text, retina };
  });
  if (errors.length) throw Error(errors.join("\n"));
  return results;
};
