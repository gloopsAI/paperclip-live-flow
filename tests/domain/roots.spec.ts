import { describe, expect, it } from "vitest";
import {
  dedupeById,
  dedupeIds,
  groupIssuesByRoot,
  resolveUniqueRoots
} from "../../src/domain/roots.js";
import type { IssueRef } from "../../src/domain/types.js";

describe("resolveUniqueRoots", () => {
  const cases: Array<{ name: string; issues: IssueRef[]; expected: string[] }> = [
    {
      name: "single root",
      issues: [
        {
          id: "a",
          parentId: null,
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "A",
          status: "in_progress"
        }
      ],
      expected: ["a"]
    },
    {
      name: "parent and child collapse to one root",
      issues: [
        {
          id: "root",
          parentId: null,
          projectId: "p1",
          assigneeAgentId: null,
          identifier: "R",
          title: "Root",
          status: "in_progress"
        },
        {
          id: "child",
          parentId: "root",
          projectId: "p1",
          assigneeAgentId: null,
          identifier: "C",
          title: "Child",
          status: "in_progress"
        }
      ],
      expected: ["root"]
    },
    {
      name: "explicit rootId wins",
      issues: [
        {
          id: "child",
          parentId: "mid",
          rootId: "root",
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "Child",
          status: "todo"
        },
        {
          id: "root",
          parentId: null,
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "Root",
          status: "todo"
        }
      ],
      expected: ["root"]
    },
    {
      name: "two disjoint roots",
      issues: [
        {
          id: "r1",
          parentId: null,
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "R1",
          status: "todo"
        },
        {
          id: "r2",
          parentId: null,
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "R2",
          status: "blocked"
        },
        {
          id: "c1",
          parentId: "r1",
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "C1",
          status: "todo"
        }
      ],
      expected: ["r1", "r2"]
    },
    {
      name: "missing parent treats issue as its own root",
      issues: [
        {
          id: "orphan",
          parentId: "missing",
          projectId: null,
          assigneeAgentId: null,
          identifier: null,
          title: "Orphan",
          status: "todo"
        }
      ],
      expected: ["orphan"]
    }
  ];

  it.each(cases)("$name", ({ issues, expected }) => {
    expect(resolveUniqueRoots(issues).sort()).toEqual(expected.sort());
  });
});

describe("groupIssuesByRoot", () => {
  it("groups descendants under the same root", () => {
    const issues: IssueRef[] = [
      {
        id: "root",
        parentId: null,
        projectId: null,
        assigneeAgentId: null,
        identifier: null,
        title: "Root",
        status: "in_progress"
      },
      {
        id: "child",
        parentId: "root",
        projectId: null,
        assigneeAgentId: null,
        identifier: null,
        title: "Child",
        status: "in_progress"
      }
    ];
    const groups = groupIssuesByRoot(issues);
    expect(groups.get("root")).toHaveLength(2);
  });
});

describe("dedupeIds", () => {
  it("preserves first-seen order", () => {
    expect(dedupeIds(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });
});

describe("dedupeById", () => {
  it("dedupes runs and incidents by id", () => {
    const runs = dedupeById([
      { id: "run-1", issueId: "i1" },
      { id: "run-1", issueId: "i1" },
      { id: "run-2", issueId: "i2" }
    ]);
    expect(runs).toHaveLength(2);
  });
});
