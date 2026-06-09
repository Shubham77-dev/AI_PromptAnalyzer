"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterTag } from "@/components/ui/FilterTag";

// Mock data for demonstration
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    plan: "PRO" as const,
    prompts: 45,
    joined: "2024-01-15",
    status: "ACTIVE" as const,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    plan: "FREE" as const,
    prompts: 12,
    joined: "2024-02-20",
    status: "ACTIVE" as const,
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    plan: "PRO" as const,
    prompts: 78,
    joined: "2023-11-10",
    status: "FLAGGED" as const,
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice.brown@example.com",
    plan: "FREE" as const,
    prompts: 3,
    joined: "2024-03-05",
    status: "SUSPENDED" as const,
  },
  {
    id: "5",
    name: "Charlie Wilson",
    email: "charlie.wilson@example.com",
    plan: "PRO" as const,
    prompts: 156,
    joined: "2023-08-22",
    status: "ACTIVE" as const,
  },
];

type FilterType = "all" | "active" | "pro" | "free" | "flagged";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PlanPill({ plan }: { plan: "PRO" | "FREE" }) {
  const isPro = plan === "PRO";
  return (
    <span
      className="inline-flex font-medium"
      style={{
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 12,
        background: isPro ? "rgba(123,92,240,.15)" : "rgba(200,200,220,.15)",
        color: isPro ? "var(--pa-acc1)" : "var(--pa-muted)",
        border: `1px solid ${isPro ? "rgba(123,92,240,.3)" : "var(--pa-card-border)"}`,
      }}
    >
      {plan}
    </span>
  );
}

function StatusPill({ status }: { status: "ACTIVE" | "FLAGGED" | "SUSPENDED" }) {
  const styles = {
    ACTIVE: {
      bg: "rgba(6,214,160,.15)",
      color: "var(--pa-acc2)",
      border: "rgba(6,214,160,.3)",
    },
    FLAGGED: {
      bg: "rgba(255,183,3,.15)",
      color: "var(--pa-acc4)",
      border: "rgba(255,183,3,.3)",
    },
    SUSPENDED: {
      bg: "rgba(255,107,53,.15)",
      color: "var(--pa-acc3)",
      border: "rgba(255,107,53,.3)",
    },
  };

  const style = styles[status];

  return (
    <span
      className="inline-flex font-medium"
      style={{
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 12,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function UserTableContent({
  searchQuery = "",
  planFilter = "",
  statusFilter = "",
}: Readonly<{
  searchQuery?: string;
  planFilter?: string;
  statusFilter?: string;
}>) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery || "");
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    planFilter === "PRO" || planFilter === "FREE" || statusFilter === "ACTIVE" || statusFilter === "FLAGGED"
      ? (planFilter as any) || (statusFilter as any)
      : "all"
  );

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && user.status === "ACTIVE") ||
      (activeFilter === "pro" && user.plan === "PRO") ||
      (activeFilter === "free" && user.plan === "FREE") ||
      (activeFilter === "flagged" && user.status === "FLAGGED");

    return matchesSearch && matchesFilter;
  });

  const handleViewClick = (userId: string) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeFilter !== "all") {
      if (activeFilter === "active") params.set("status", "ACTIVE");
      if (activeFilter === "pro") params.set("plan", "PRO");
      if (activeFilter === "free") params.set("plan", "FREE");
      if (activeFilter === "flagged") params.set("status", "FLAGGED");
    }
    params.set("view", userId);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filter !== "all") {
      if (filter === "active") params.set("status", "ACTIVE");
      if (filter === "pro") params.set("plan", "PRO");
      if (filter === "free") params.set("plan", "FREE");
      if (filter === "flagged") params.set("status", "FLAGGED");
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    if (activeFilter !== "all") {
      if (activeFilter === "active") params.set("status", "ACTIVE");
      if (activeFilter === "pro") params.set("plan", "PRO");
      if (activeFilter === "free") params.set("plan", "FREE");
      if (activeFilter === "flagged") params.set("status", "FLAGGED");
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--pa-text)" }}
          >
            User management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ButtonOutline>Export</ButtonOutline>
          <ButtonGradient>+ Invite user</ButtonGradient>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          placeholder="Search users by name or email..."
          value={search}
          onChange={handleSearchChange}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterTag
            label="All users"
            active={activeFilter === "all"}
            onClick={() => handleFilterChange("all")}
          />
          <FilterTag
            label="Active"
            active={activeFilter === "active"}
            onClick={() => handleFilterChange("active")}
          />
          <FilterTag
            label="Pro plan"
            active={activeFilter === "pro"}
            onClick={() => handleFilterChange("pro")}
          />
          <FilterTag
            label="Free plan"
            active={activeFilter === "free"}
            onClick={() => handleFilterChange("free")}
          />
          <FilterTag
            label="Flagged"
            active={activeFilter === "flagged"}
            onClick={() => handleFilterChange("flagged")}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--pa-card-border)",
                }}
              >
                <th
                  className="text-left p-4 font-medium"
                  style={{
                    color: "var(--pa-muted)",
                    fontSize: 11,
                  }}
                >
                  User
                </th>
                <th
                  className="text-left p-4 font-medium"
                  style={{
                    color: "var(--pa-muted)",
                    fontSize: 11,
                  }}
                >
                  Plan
                </th>
                <th
                  className="text-left p-4 font-medium"
                  style={{
                    color: "var(--pa-muted)",
                    fontSize: 11,
                  }}
                >
                  Prompts
                </th>
                <th
                  className="text-left p-4 font-medium"
                  style={{
                    color: "var(--pa-muted)",
                    fontSize: 11,
                  }}
                >
                  Joined
                </th>
                <th
                  className="text-left p-4 font-medium"
                  style={{
                    color: "var(--pa-muted)",
                    fontSize: 11,
                  }}
                >
                  Status
                </th>
                <th
                  className="text-left p-4 font-medium"
                  style={{
                    color: "var(--pa-muted)",
                    fontSize: 11,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="pa-transition pa-table-row"
                  style={{
                    borderBottom: "1px solid var(--pa-card-border)",
                  }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar initials={getInitials(user.name)} size="md" />
                      <div>
                        <div
                          className="font-medium"
                          style={{
                            color: "var(--pa-text)",
                            fontSize: 11,
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{
                            color: "var(--pa-muted)",
                            fontSize: 10,
                          }}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <PlanPill plan={user.plan} />
                  </td>
                  <td className="p-4">
                    <span
                      style={{
                        color: "var(--pa-text)",
                        fontSize: 12,
                      }}
                    >
                      {user.prompts}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      style={{
                        color: "var(--pa-muted)",
                        fontSize: 10,
                      }}
                    >
                      {user.joined}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusPill status={user.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewClick(user.id)}
                        className="pa-btn-transition"
                      >
                        <ButtonOutline>View</ButtonOutline>
                      </button>
                      <button
                        className="pa-btn-transition font-medium"
                        style={{
                          fontSize: 11,
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: "1px solid var(--pa-card-border)",
                          background: "transparent",
                          color: "var(--pa-muted)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--pa-acc3)";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.borderColor = "var(--pa-acc3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--pa-muted)";
                          e.currentTarget.style.borderColor = "var(--pa-card-border)";
                        }}
                      >
                        Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
