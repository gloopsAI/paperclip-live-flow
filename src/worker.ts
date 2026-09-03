import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.data.register("plugin-about", async () => {
      return {
        id: "gloops.live-flow",
        version: "0.1.0",
        description: "Read-only workflow visibility for Paperclip",
        phase: "scaffold"
      };
    });
  },

  async onHealth() {
    return { status: "ok", message: "Live Flow worker is running" };
  }
});

export default plugin;
runWorker(plugin, import.meta.url);
