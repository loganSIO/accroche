ALTER TABLE "conversation_members" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "conversation_members_userId_deletedAt_idx" ON "conversation_members"("userId", "deletedAt");
