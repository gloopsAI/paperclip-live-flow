import { KeyValueList } from "@paperclipai/plugin-sdk/ui";
import type {
  ApprovalFact,
  AttentionItem,
  DocumentFact,
  ExecutionPolicyFacts,
  ExecutionStateFacts,
  IncidentFact,
  InvocationBlockFact,
  OrchestrationDerivedFacts,
  TokenCostFacts
} from "../../contracts/common.js";
import { CONTEXT_WINDOW_UTILIZATION_MESSAGE } from "../../contracts/common.js";
import { card, muted, sectionTitle, stack, tableStyle, tdStyle, thStyle } from "../styles.js";
import { formatTimestamp, formatTokenCount, formatCostCents } from "./format.js";
import { attentionReasonLabel } from "./status.js";

function availabilityCopy(availability: string): string {
  if (availability === "available") return "Available";
  if (availability === "unavailable") return "Unavailable";
  return "Not available";
}

export function ExecutionPolicyStateSection({
  executionPolicy,
  executionState
}: {
  executionPolicy: ExecutionPolicyFacts;
  executionState: ExecutionStateFacts;
}) {
  const policyPairs = [
    { label: "Policy availability", value: availabilityCopy(executionPolicy.availability) },
    {
      label: "Configured stages",
      value:
        executionPolicy.stages.length > 0
          ? executionPolicy.stages.map((stage) => `${stage.type} (${stage.id})`).join(", ")
          : "—"
    }
  ];

  const statePairs = [
    { label: "State availability", value: availabilityCopy(executionState.availability) },
    { label: "Execution status", value: executionState.status ?? "—" },
    { label: "Current stage id", value: executionState.currentStageId ?? "—" },
    { label: "Current stage type", value: executionState.currentStageType ?? "—" },
    {
      label: "Current participant",
      value:
        executionState.currentParticipantLabel ??
        executionState.currentParticipantAgentId ??
        executionState.currentParticipantUserId ??
        "Unassigned"
    },
    {
      label: "Participant agent id",
      value: executionState.currentParticipantAgentId ?? "—"
    },
    {
      label: "Participant user id",
      value: executionState.currentParticipantUserId ?? "—"
    },
    {
      label: "Completed stage ids",
      value:
        executionState.completedStageIds.length > 0
          ? executionState.completedStageIds.join(", ")
          : "None"
    },
    { label: "Last decision outcome", value: executionState.lastDecisionOutcome ?? "—" },
    {
      label: "Changes requested count",
      value:
        executionState.changesRequestedCount === null
          ? "—"
          : String(executionState.changesRequestedCount)
    }
  ];

  return (
    <section aria-labelledby="lf-execution-heading" style={stack}>
      <h2 id="lf-execution-heading" style={sectionTitle}>
        Execution policy and state
      </h2>
      <div style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: "13px" }}>Configured policy</h3>
        <KeyValueList pairs={policyPairs} />
        <h3 style={{ margin: "16px 0 8px", fontSize: "13px" }}>Current state</h3>
        <KeyValueList pairs={statePairs} />
      </div>
    </section>
  );
}

export function ApprovalsSection({ orchestration }: { orchestration: OrchestrationDerivedFacts }) {
  return (
    <section aria-labelledby="lf-approvals-heading" style={stack}>
      <h2 id="lf-approvals-heading" style={sectionTitle}>
        Approvals
      </h2>
      <div style={card}>
        <p style={{ ...muted, margin: "0 0 8px" }}>
          Collection availability: {availabilityCopy(orchestration.availability)}
        </p>
        {orchestration.availability === "unavailable" ? (
          <p style={{ margin: 0 }} role="note">
            Approval summaries are unavailable because orchestration could not be loaded.
          </p>
        ) : orchestration.approvals.length === 0 ? (
          <p style={{ margin: 0 }}>No approval summaries returned for this issue.</p>
        ) : (
          <ApprovalTable approvals={orchestration.approvals} />
        )}
      </div>
    </section>
  );
}

function ApprovalTable({ approvals }: { approvals: ApprovalFact[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th scope="col" style={thStyle}>
              Type
            </th>
            <th scope="col" style={thStyle}>
              Status
            </th>
            <th scope="col" style={thStyle}>
              Requested by
            </th>
            <th scope="col" style={thStyle}>
              Decided by
            </th>
            <th scope="col" style={thStyle}>
              Decided at
            </th>
            <th scope="col" style={thStyle}>
              Created at
            </th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr key={approval.id}>
              <td style={tdStyle}>{approval.type}</td>
              <td style={tdStyle}>{approval.status}</td>
              <td style={tdStyle}>
                {approval.requestedByAgentId ?? approval.requestedByUserId ?? "—"}
              </td>
              <td style={tdStyle}>{approval.decidedByUserId ?? "—"}</td>
              <td style={tdStyle}>{formatTimestamp(approval.decidedAt)}</td>
              <td style={tdStyle}>{formatTimestamp(approval.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InvocationBlocksSection({
  orchestration
}: {
  orchestration: OrchestrationDerivedFacts;
}) {
  return (
    <section aria-labelledby="lf-invocation-blocks-heading" style={stack}>
      <h2 id="lf-invocation-blocks-heading" style={sectionTitle}>
        Invocation blocks
      </h2>
      <div style={card}>
        <p style={{ ...muted, margin: "0 0 8px" }}>
          Collection availability: {availabilityCopy(orchestration.availability)}
        </p>
        {orchestration.availability === "unavailable" ? (
          <p style={{ margin: 0 }} role="note">
            Invocation block summaries are unavailable because orchestration could not be loaded.
          </p>
        ) : orchestration.invocationBlocks.length === 0 ? (
          <p style={{ margin: 0 }}>No invocation blocks reported for this issue.</p>
        ) : (
          <InvocationBlockTable blocks={orchestration.invocationBlocks} />
        )}
      </div>
    </section>
  );
}

function InvocationBlockTable({ blocks }: { blocks: InvocationBlockFact[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th scope="col" style={thStyle}>
              Agent
            </th>
            <th scope="col" style={thStyle}>
              Scope type
            </th>
            <th scope="col" style={thStyle}>
              Scope id
            </th>
            <th scope="col" style={thStyle}>
              Scope name
            </th>
            <th scope="col" style={thStyle}>
              Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={`${block.issueId}:${block.agentId}:${block.scopeId}:${block.reason}`}>
              <td style={tdStyle}>{block.agentId}</td>
              <td style={tdStyle}>{block.scopeType}</td>
              <td style={tdStyle}>{block.scopeId}</td>
              <td style={tdStyle}>{block.scopeName ?? "—"}</td>
              <td style={tdStyle}>{block.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AttentionSection({ attention }: { attention: AttentionItem[] }) {
  if (attention.length === 0) {
    return (
      <section aria-labelledby="lf-attention-heading" style={stack}>
        <h2 id="lf-attention-heading" style={sectionTitle}>
          Attention
        </h2>
        <p style={{ ...muted, margin: 0 }}>No attention items for this issue.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="lf-attention-heading" style={stack}>
      <h2 id="lf-attention-heading" style={sectionTitle}>
        Attention ({attention.length})
      </h2>
      <ul style={{ ...card, margin: 0, padding: "12px 12px 12px 28px" }}>
        {attention.map((item) => (
          <li
            key={`${item.issueId}:${item.reason}:${item.explanation}`}
            style={{ marginBottom: "10px" }}
          >
            <strong>{attentionReasonLabel(item.reason)}</strong>
            <div>{item.title}</div>
            <p style={{ ...muted, margin: "4px 0 0" }}>{item.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IncidentsSection({ incidents }: { incidents: IncidentFact[] }) {
  if (incidents.length === 0) return null;
  return (
    <section aria-labelledby="lf-incidents-heading" style={stack}>
      <h2 id="lf-incidents-heading" style={sectionTitle}>
        Open budget incidents
      </h2>
      <ul style={{ ...card, margin: 0, padding: "12px 12px 12px 28px" }}>
        {incidents.map((incident) => (
          <li key={incident.id}>
            {incident.scopeType} scope {incident.scopeName ?? incident.scopeId} — {incident.status}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TokenCostSection({ tokenCost }: { tokenCost: TokenCostFacts }) {
  const pairs = [
    { label: "Scope", value: tokenCost.scopeLabel },
    { label: "Availability", value: tokenCost.availability },
    { label: "Input tokens", value: formatTokenCount(tokenCost.inputTokens) },
    { label: "Cached input tokens", value: formatTokenCount(tokenCost.cachedInputTokens) },
    { label: "Output tokens", value: formatTokenCount(tokenCost.outputTokens) },
    { label: "Cost", value: formatCostCents(tokenCost.costCents) },
    { label: "Billing code", value: tokenCost.billingCode ?? "—" },
    { label: "Snapshot", value: formatTimestamp(tokenCost.snapshotAt) }
  ];

  return (
    <section aria-labelledby="lf-token-heading" style={stack}>
      <h2 id="lf-token-heading" style={sectionTitle}>
        Token and cost facts
      </h2>
      <div style={card}>
        <KeyValueList pairs={pairs} />
        <p style={{ ...muted, margin: "12px 0 0" }} role="note">
          {CONTEXT_WINDOW_UTILIZATION_MESSAGE}
        </p>
      </div>
    </section>
  );
}

export function DocumentsSection({ documents }: { documents: DocumentFact[] }) {
  return (
    <section aria-labelledby="lf-documents-heading" style={stack}>
      <h2 id="lf-documents-heading" style={sectionTitle}>
        Documents and evidence
      </h2>
      {documents.length === 0 ? (
        <p style={{ ...muted, margin: 0 }}>No documents returned for this subtree.</p>
      ) : (
        <ul style={{ ...card, margin: 0, padding: "12px 12px 12px 28px" }}>
          {documents.map((doc) => (
            <li key={doc.id}>
              {doc.title ?? doc.key} <span style={muted}>({doc.key})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function WorkProductsSection({ missingFields }: { missingFields: string[] }) {
  const showsMissing =
    missingFields.includes("workProducts") || missingFields.includes("deployReceipts");
  if (!showsMissing) return null;

  return (
    <section aria-labelledby="lf-workproducts-heading" style={stack}>
      <h2 id="lf-workproducts-heading" style={sectionTitle}>
        Merge and deploy evidence
      </h2>
      <div style={card} role="note">
        <p style={{ margin: 0 }}>
          Work products and deploy receipts are not exposed by the current public SDK. Merge and
          Deploy phases remain not tracked or unavailable exactly as returned by the worker.
        </p>
        <p style={{ ...muted, margin: "8px 0 0" }}>Missing fields: {missingFields.join(", ")}</p>
      </div>
    </section>
  );
}
