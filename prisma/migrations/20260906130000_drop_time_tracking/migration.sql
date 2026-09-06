-- Time tracking removed: projects are contract + duration based.
-- Team/labour cost is now a single estimated field per project.

ALTER TABLE "projects" ADD COLUMN "team_cost" DECIMAL(65,30) NOT NULL DEFAULT 0;

DROP TABLE "project_hours";

ALTER TABLE "users" DROP COLUMN "internal_cost_rate";
