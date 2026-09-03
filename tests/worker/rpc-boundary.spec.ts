import { PassThrough } from "node:stream";
import { createInterface } from "node:readline";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createRequest,
  definePlugin,
  isJsonRpcResponse,
  parseMessage,
  serializeMessage,
  startWorkerRpcHost
} from "@paperclipai/plugin-sdk";
import type { Issue } from "@paperclipai/shared";
import manifest from "../../src/manifest.js";
import { sharedHandlerCache } from "../../src/worker/cache.js";
import { ISSUE_NOT_FOUND_MESSAGE } from "../../src/worker/constants.js";
import { registerLiveFlowHandlers } from "../../src/worker/setup.js";
import { createLiveFlowRpcClient } from "./live-flow-rpc-fixtures.js";

const COMPANY_A = "11111111-1111-1111-1111-111111111111";
const COMPANY_B = "22222222-2222-2222-2222-222222222222";
const ISSUE_ROOT = "44444444-4444-4444-4444-444444444444";
const ISSUE_CHILD = "55555555-5555-5555-5555-555555555555";
const ISSUE_FOREIGN = "66666666-6666-6666-6666-666666666666";
const ISSUE_ABSENT = "00000000-0000-0000-0000-000000000099";

function baseIssue(overrides: Partial<Issue> & Pick<Issue, "id" | "companyId" | "title">): Issue {
  const now = new Date();
  return {
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    description: null,
    status: "in_progress",
    workMode: "autonomous",
    priority: "medium",
    reviewPolicy: null,
    assigneeAgentId: null,
    assigneeUserId: null,
    checkoutRunId: null,
    executionRunId: null,
    executionAgentNameKey: null,
    executionLockedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    responsibleUserId: null,
    issueNumber: 1,
    identifier: "LF-1",
    requestDepth: 0,
    billingCode: null,
    assigneeAdapterOverrides: null,
    executionWorkspaceId: null,
    executionWorkspacePreference: null,
    executionWorkspaceSettings: null,
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  } as Issue;
}

function seedIssues(): Issue[] {
  const rootIssue = baseIssue({
    id: ISSUE_ROOT,
    companyId: COMPANY_A,
    title: "Root issue",
    status: "in_progress",
    identifier: "LF-ROOT"
  });
  const childIssue = baseIssue({
    id: ISSUE_CHILD,
    companyId: COMPANY_A,
    parentId: ISSUE_ROOT,
    title: "Child issue",
    identifier: "LF-CHILD"
  });
  const foreignIssue = baseIssue({
    id: ISSUE_FOREIGN,
    companyId: COMPANY_B,
    title: "Foreign issue",
    identifier: "LF-FOREIGN"
  });
  return [rootIssue, childIssue, foreignIssue];
}

function createRpcClient(plugin: ReturnType<typeof definePlugin>) {
  const hostToWorker = new PassThrough();
  const workerToHost = new PassThrough();
  const hostReadline = createInterface({ input: workerToHost });
  const pending = new Map<string, (response: unknown) => void>();
  let nextRequestId = 1;

  const worker = startWorkerRpcHost({
    plugin,
    stdin: hostToWorker,
    stdout: workerToHost
  });

  hostReadline.on("line", (line) => {
    const message = parseMessage(line);
    if (isJsonRpcResponse(message)) {
      pending.get(String(message.id))?.(message);
      pending.delete(String(message.id));
    }
  });

  async function callWorker(method: string, params: unknown) {
    const id = `host-${nextRequestId++}`;
    const result = new Promise<unknown>((resolve, reject) => {
      pending.set(id, (response: unknown) => {
        const typed = response as { error?: { message: string }; result?: unknown };
        if (typed.error) {
          reject(new Error(typed.error.message));
          return;
        }
        resolve(typed.result);
      });
    });
    hostToWorker.write(serializeMessage(createRequest(method, params, id)));
    return result;
  }

  return {
    callWorker,
    async initialize() {
      await callWorker("initialize", {
        manifest,
        config: {},
        instanceInfo: { instanceId: "test", hostVersion: "0.0.0" },
        apiVersion: 1
      });
    },
    stop() {
      worker.stop();
      hostReadline.close();
      hostToWorker.destroy();
      workerToHost.destroy();
    }
  };
}

describe("worker RPC company boundary", () => {
  beforeEach(() => {
    sharedHandlerCache.clear();
  });

  it("overrides malicious params.companyId with top-level authenticated companyId", async () => {
    const plugin = definePlugin({
      async setup(ctx) {
        ctx.data.register("company-id-probe", async (params) => ({
          companyId: params.companyId
        }));
      }
    });
    const rpc = createRpcClient(plugin);
    try {
      await rpc.initialize();
      const result = (await rpc.callWorker("getData", {
        key: "company-id-probe",
        companyId: "company-trusted",
        params: { companyId: "company-malicious" }
      })) as { companyId: string };
      expect(result.companyId).toBe("company-trusted");
    } finally {
      rpc.stop();
    }
  });

  it("fails closed when top-level companyId is missing", async () => {
    const plugin = definePlugin({
      async setup(ctx) {
        registerLiveFlowHandlers(ctx);
      }
    });
    const rpc = createRpcClient(plugin);
    try {
      await rpc.initialize();
      await expect(
        rpc.callWorker("getData", {
          key: "plugin-about",
          params: {}
        })
      ).rejects.toThrow(/companyId is required/i);
    } finally {
      rpc.stop();
    }
  });

  it("routes nested issues.get with authenticated company scope for issue-flow", async () => {
    const rpc = createLiveFlowRpcClient(seedIssues());
    try {
      await rpc.initialize();
      await rpc.getData("issue-flow", COMPANY_A, {
        issueId: ISSUE_ROOT,
        companyId: COMPANY_B
      });
      expect(rpc.store.issueGetCalls.length).toBeGreaterThan(0);
      expect(rpc.store.issueGetCalls.every((call) => call.companyId === COMPANY_A)).toBe(true);
      expect(rpc.store.issueGetCalls.some((call) => call.companyId === COMPANY_B)).toBe(false);
    } finally {
      rpc.stop();
    }
  });

  it("returns the same not-found for foreign and absent issues over real RPC", async () => {
    const rpc = createLiveFlowRpcClient(seedIssues());
    try {
      await rpc.initialize();
      let foreignMessage = "";
      let absentMessage = "";
      try {
        await rpc.getData("issue-flow", COMPANY_A, {
          issueId: ISSUE_FOREIGN,
          companyId: COMPANY_B
        });
      } catch (error) {
        foreignMessage = error instanceof Error ? error.message : String(error);
      }
      try {
        await rpc.getData("issue-flow", COMPANY_A, { issueId: ISSUE_ABSENT });
      } catch (error) {
        absentMessage = error instanceof Error ? error.message : String(error);
      }
      expect(foreignMessage).toBe(ISSUE_NOT_FOUND_MESSAGE);
      expect(absentMessage).toBe(ISSUE_NOT_FOUND_MESSAGE);
      expect(absentMessage).toBe(foreignMessage);
    } finally {
      rpc.stop();
    }
  });
});
