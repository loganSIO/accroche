-- CreateTable
CREATE TABLE "musician_showcase_groups" (
    "id" TEXT NOT NULL,
    "musicianProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" "GroupStatus" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "musician_showcase_groups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "musician_showcase_groups" ADD CONSTRAINT "musician_showcase_groups_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "musician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
