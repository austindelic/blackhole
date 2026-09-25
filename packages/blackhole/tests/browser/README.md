# Browser smoke fixture

Install the packed browser/CLI packages, React, React DOM and Vite into a clean temporary consumer. Copy index.html, main.tsx and vite.config.mjs into that consumer. Run `blackhole add --framework vanilla --out-dir copied` there, then serve on port 5198.

Use the Playwright CLI skill:

```
playwright-cli -s=blackhole-web open http://127.0.0.1:5198
playwright-cli -s=blackhole-web run-code --filename=/absolute/path/to/lifecycle.cjs
playwright-cli -s=blackhole-web run-code --filename=/absolute/path/to/fallback.cjs
playwright-cli -s=blackhole-web console
playwright-cli -s=blackhole-web requests
```

Lifecycle checks cover package + copied-source readiness, pause clock stability, paused visual controls, camera updates and resize, resuming, React StrictMode, initially paused first frame, explicit playback overriding reduced motion, and disposal. Fallback checks deliberately deny WebGL contexts and WebGPU adapters, then verify visible errors, fallback and caller canvas preservation. Console GPU errors are expected only during the deliberate failure checks. Use a fresh page for console/network baseline verification.
