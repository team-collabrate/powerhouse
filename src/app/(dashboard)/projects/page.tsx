import { getSessionContext } from "@/lib/session";
import { listProjects, type ProjectStatus } from "@/lib/queries/projects";
import { ProjectsFilters } from "@/components/projects/ProjectsFilters";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { NewProjectButton } from "@/components/projects/NewProjectButton";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to manage projects
        </p>
        <p className="mt-1 text-[13px] text-ink-3">
          Set your Supabase env vars and sign in. The dashboard above is showing
          sample data.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const { items, counts } = await listProjects(ctx.agencyId, {
    status: (sp.status as ProjectStatus) ?? undefined,
    q: sp.q,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Projects
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {counts.all} total · {counts.active} active
          </p>
        </div>
        <NewProjectButton />
      </div>

      <ProjectsFilters counts={counts} />
      <ProjectsTable items={items} />
    </div>
  );
}
