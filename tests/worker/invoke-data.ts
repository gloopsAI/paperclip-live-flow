import { expect } from "vitest";
import type { TestHarness } from "@paperclipai/plugin-sdk";
import { mergeHostRpcParams } from "../../src/worker/company-scope.js";
import { ISSUE_NOT_FOUND_MESSAGE } from "../../src/worker/constants.js";

type DataHandler = (params: Record<string, unknown>) => Promise<unknown>;

export async function invokeRpcGetData<T>(
  harness: TestHarness,
  key: string,
  hostCompanyId: string | undefined,
  params: Record<string, unknown> = {}
): Promise<T> {
  const merged = mergeHostRpcParams(hostCompanyId, params);
  return harness.getData<T>(key, merged);
}

export function expectNotFound(promise: Promise<unknown>): Promise<void> {
  return expect(promise).rejects.toThrow(ISSUE_NOT_FOUND_MESSAGE);
}

export async function getRegisteredHandler(
  harness: TestHarness,
  key: string
): Promise<DataHandler> {
  const registry = (harness.ctx.data as { register: (k: string, h: DataHandler) => void }).register;
  void registry;
  return (params: Record<string, unknown>) => harness.getData(key, params);
}
