import { PassThrough } from "node:stream";
import { createInterface } from "node:readline";
import type { Issue } from "@paperclipai/shared";
import {
  createErrorResponse,
  createRequest,
  createSuccessResponse,
  definePlugin,
  isJsonRpcRequest,
  isJsonRpcResponse,
  parseMessage,
  serializeMessage,
  startWorkerRpcHost
} from "@paperclipai/plugin-sdk";
import manifest from "../../src/manifest.js";
import { ISSUE_NOT_FOUND_MESSAGE } from "../../src/worker/constants.js";
import { registerLiveFlowHandlers } from "../../src/worker/setup.js";

export type RpcIssueStore = {
  issues: Map<string, Issue>;
  issueGetCalls: Array<{ issueId: string; companyId: string }>;
};

export function createLiveFlowRpcClient(issues: Issue[]) {
  const store: RpcIssueStore = {
    issues: new Map(issues.map((issue) => [issue.id, issue])),
    issueGetCalls: []
  };

  const hostToWorker = new PassThrough();
  const workerToHost = new PassThrough();
  const hostReadline = createInterface({ input: workerToHost });
  const pending = new Map<string, (response: unknown) => void>();
  let nextRequestId = 1;

  const plugin = definePlugin({
    async setup(ctx) {
      registerLiveFlowHandlers(ctx);
    }
  });

  const worker = startWorkerRpcHost({
    plugin,
    stdin: hostToWorker,
    stdout: workerToHost
  });

  function isInCompany(issue: Issue | undefined, companyId: string): boolean {
    return Boolean(issue && issue.companyId === companyId);
  }

  hostReadline.on("line", (line) => {
    const message = parseMessage(line);
    if (isJsonRpcResponse(message)) {
      pending.get(String(message.id))?.(message);
      pending.delete(String(message.id));
      return;
    }
    if (!isJsonRpcRequest(message)) return;

    const { method, params, id } = message;

    if (method === "issues.get") {
      const { issueId, companyId } = params as { issueId: string; companyId: string };
      store.issueGetCalls.push({ issueId, companyId });
      const issue = store.issues.get(issueId);
      const result = isInCompany(issue, companyId) ? issue : null;
      hostToWorker.write(serializeMessage(createSuccessResponse(id, result)));
      return;
    }

    if (method === "issues.getSubtree") {
      const { issueId, companyId } = params as { issueId: string; companyId: string };
      const root = store.issues.get(issueId);
      if (!isInCompany(root, companyId)) {
        hostToWorker.write(
          serializeMessage(createErrorResponse(id, -32000, ISSUE_NOT_FOUND_MESSAGE))
        );
        return;
      }
      const issueIds = [root!.id];
      let frontier = [root!.id];
      while (frontier.length > 0) {
        const children = [...store.issues.values()]
          .filter(
            (issue) => issue.companyId === companyId && frontier.includes(issue.parentId ?? "")
          )
          .map((issue) => issue.id)
          .filter((candidateId) => !issueIds.includes(candidateId));
        issueIds.push(...children);
        frontier = children;
      }
      const subtreeIssues = issueIds
        .map((candidateId) => store.issues.get(candidateId))
        .filter((candidate): candidate is Issue => Boolean(candidate));
      hostToWorker.write(
        serializeMessage(
          createSuccessResponse(id, {
            rootIssueId: root!.id,
            companyId,
            issueIds,
            issues: subtreeIssues,
            relations: Object.fromEntries(
              issueIds.map((candidateId) => [candidateId, { blockedBy: [] }])
            ),
            documents: Object.fromEntries(issueIds.map((candidateId) => [candidateId, []])),
            activeRuns: Object.fromEntries(issueIds.map((candidateId) => [candidateId, []])),
            assignees: {}
          })
        )
      );
      return;
    }

    if (method === "issues.summaries.getOrchestration") {
      const { issueId, companyId } = params as { issueId: string; companyId: string };
      const root = store.issues.get(issueId);
      if (!isInCompany(root, companyId)) {
        hostToWorker.write(
          serializeMessage(createErrorResponse(id, -32000, ISSUE_NOT_FOUND_MESSAGE))
        );
        return;
      }
      const subtreeIssueIds = [root!.id];
      hostToWorker.write(
        serializeMessage(
          createSuccessResponse(id, {
            issueId: root!.id,
            companyId,
            subtreeIssueIds,
            relations: Object.fromEntries(
              subtreeIssueIds.map((candidateId) => [candidateId, { blockedBy: [] }])
            ),
            approvals: [],
            runs: [],
            costs: {
              costCents: 0,
              inputTokens: 0,
              cachedInputTokens: 0,
              outputTokens: 0,
              billingCode: null
            },
            openBudgetIncidents: [],
            invocationBlocks: []
          })
        )
      );
      return;
    }

    if (method === "issues.list") {
      const { companyId, status } = params as { companyId: string; status?: string };
      const rows = [...store.issues.values()].filter(
        (issue) => issue.companyId === companyId && (!status || issue.status === status)
      );
      hostToWorker.write(serializeMessage(createSuccessResponse(id, rows)));
      return;
    }

    if (method === "projects.list") {
      hostToWorker.write(serializeMessage(createSuccessResponse(id, [])));
      return;
    }

    if (method === "agents.list") {
      hostToWorker.write(serializeMessage(createSuccessResponse(id, [])));
      return;
    }

    if (method === "projects.get" || method === "agents.get") {
      hostToWorker.write(serializeMessage(createSuccessResponse(id, null)));
      return;
    }

    hostToWorker.write(
      serializeMessage(createErrorResponse(id, -32601, `Unhandled host method ${method}`))
    );
  });

  async function callWorker(method: string, params: unknown) {
    const requestId = `host-${nextRequestId++}`;
    const result = new Promise<unknown>((resolve, reject) => {
      pending.set(requestId, (response: unknown) => {
        const typed = response as { error?: { message: string }; result?: unknown };
        if (typed.error) {
          reject(new Error(typed.error.message));
          return;
        }
        resolve(typed.result);
      });
    });
    hostToWorker.write(serializeMessage(createRequest(method, params, requestId)));
    return result;
  }

  return {
    store,
    async initialize() {
      await callWorker("initialize", {
        manifest,
        config: {},
        instanceInfo: { instanceId: "test", hostVersion: "0.0.0" },
        apiVersion: 1
      });
    },
    getData<T>(key: string, companyId: string, params: Record<string, unknown> = {}) {
      return callWorker("getData", { key, companyId, params }) as Promise<T>;
    },
    stop() {
      worker.stop();
      hostReadline.close();
      hostToWorker.destroy();
      workerToHost.destroy();
    }
  };
}
