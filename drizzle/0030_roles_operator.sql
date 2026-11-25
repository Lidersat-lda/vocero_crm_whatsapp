ALTER TABLE "member" ALTER COLUMN "role" SET DEFAULT 'operator';--> statement-breakpoint
UPDATE "member" SET "role" = 'operator' WHERE "role" NOT IN ('owner', 'admin');--> statement-breakpoint
UPDATE "invitation" SET "role" = 'operator' WHERE "role" IS NOT NULL AND "role" NOT IN ('owner', 'admin');
