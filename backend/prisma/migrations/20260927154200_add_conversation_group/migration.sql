ALTER TABLE "conversations" ADD COLUMN "groupProfileId" TEXT;
CREATE INDEX "conversations_groupProfileId_idx" ON "conversations"("groupProfileId");
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_groupProfileId_fkey"
  FOREIGN KEY ("groupProfileId") REFERENCES "group_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
