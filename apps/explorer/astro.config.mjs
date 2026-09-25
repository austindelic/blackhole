import { defineConfig } from "astro/config";
import react from "@astrojs/react";
export default defineConfig({
  site: "https://blackhole.austindelic.com",
  output: "static",
  devToolbar: { enabled: false },
  integrations: [react()],
});
