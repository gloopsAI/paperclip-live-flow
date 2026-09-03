import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

declare global {
  var __paperclipPluginBridge__:
    | {
        react?: typeof React;
        sdkUi?: Record<string, unknown>;
      }
    | undefined;
}

export const mockLinkProps = vi.fn((to: string) => ({
  href: to,
  onClick: (event: { preventDefault: () => void }) => event.preventDefault()
}));

export const mockUseHostNavigation = vi.fn(() => ({
  resolveHref: (to: string) => to,
  navigate: vi.fn(),
  linkProps: mockLinkProps
}));

export const mockUseHostLocation = vi.fn(() => ({
  pathname: "/live-flow",
  search: "",
  hash: ""
}));

export const mockRefresh = vi.fn();

export type PluginDataMockState = {
  data: unknown;
  loading: boolean;
  error: { code: string; message: string } | null;
};

export let pluginDataState: PluginDataMockState = {
  data: null,
  loading: false,
  error: null
};

export const mockUsePluginData = vi.fn((_key?: string, _params?: Record<string, unknown>) => ({
  ...pluginDataState,
  refresh: mockRefresh
}));

export function setPluginDataState(state: Partial<PluginDataMockState>) {
  pluginDataState = { ...pluginDataState, ...state };
}

export function resetPluginMocks() {
  pluginDataState = { data: null, loading: false, error: null };
  mockUsePluginData.mockClear();
  mockUseHostNavigation.mockClear();
  mockUseHostLocation.mockClear();
  mockRefresh.mockClear();
  mockLinkProps.mockClear();
}

function initSdkUiBridge() {
  globalThis.__paperclipPluginBridge__ = {
    react: React,
    sdkUi: {
      StatusBadge: ({ label }: { label: string }) =>
        React.createElement("span", { "data-testid": "status-badge" }, label),
      Spinner: ({ label }: { label?: string }) =>
        React.createElement(
          "div",
          { role: "status", "aria-label": label ?? "Loading" },
          label ?? "Loading"
        ),
      KeyValueList: ({ pairs }: { pairs: Array<{ label: string; value: React.ReactNode }> }) =>
        React.createElement(
          "dl",
          null,
          pairs.flatMap((pair) => [
            React.createElement("dt", { key: `${pair.label}-label` }, pair.label),
            React.createElement("dd", { key: `${pair.label}-value` }, pair.value)
          ])
        )
    }
  };
}

initSdkUiBridge();

afterEach(() => {
  cleanup();
});

vi.mock("@paperclipai/plugin-sdk/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@paperclipai/plugin-sdk/ui")>();
  return {
    ...actual,
    usePluginData: (key: string, params?: Record<string, unknown>) =>
      mockUsePluginData(key, params),
    useHostNavigation: () => mockUseHostNavigation(),
    useHostLocation: () => mockUseHostLocation()
  };
});
