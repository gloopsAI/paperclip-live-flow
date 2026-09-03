import { usePluginData, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";

type PluginAboutData = {
  id: string;
  version: string;
  description: string;
  phase: string;
};

export function DashboardWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = usePluginData<PluginAboutData>("plugin-about");

  if (loading) {
    return <div>Loading Live Flow…</div>;
  }

  if (error) {
    return <div>Live Flow error: {error.message}</div>;
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <strong>Live Flow</strong>
      <div>{data?.description ?? "Read-only workflow visibility for Paperclip"}</div>
      <div>Phase: {data?.phase ?? "unknown"}</div>
      <div>Version: {data?.version ?? "unknown"}</div>
    </div>
  );
}
