import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { registerLiveFlowHandlers } from "./worker/setup.js";

const plugin = definePlugin({
  async setup(ctx) {
    registerLiveFlowHandlers(ctx);
  },

  async onHealth() {
    return { status: "ok", message: "Live Flow worker is running" };
  }
});

export default plugin;
runWorker(plugin, import.meta.url);
