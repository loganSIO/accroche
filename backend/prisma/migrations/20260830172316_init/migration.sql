-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('AMATEUR', 'PRO');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ASSOCIATION', 'PROFESSIONNEL');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OUVERT', 'POURVU', 'ANNULE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PROPOSE', 'CONTACTE', 'IGNORE');

-- CreateEnum
CREATE TYPE "PositionOwnerType" AS ENUM ('GROUP', 'FOUNDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rayonKm" DOUBLE PRECISION NOT NULL,
    "ville" TEXT NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musician_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL,
    "objective" TEXT[],
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "musician_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musician_instruments" (
    "id" TEXT NOT NULL,
    "musicianProfileId" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,

    CONSTRAINT "musician_instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musician_styles" (
    "id" TEXT NOT NULL,
    "musicianProfileId" TEXT NOT NULL,
    "style" TEXT NOT NULL,

    CONSTRAINT "musician_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "musicianProfileId" TEXT NOT NULL,
    "jourSemaine" TEXT NOT NULL,
    "creneauxJournee" TEXT NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "styles" TEXT[],
    "status" "GroupStatus" NOT NULL,
    "description" TEXT,
    "audioLinks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founding_profiles" (
    "id" TEXT NOT NULL,
    "founderMusicianId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "styles" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_positions" (
    "id" TEXT NOT NULL,
    "ownerType" "PositionOwnerType" NOT NULL,
    "groupProfileId" TEXT,
    "foundingProfileId" TEXT,
    "instrumentRecherche" TEXT NOT NULL,
    "niveauAttendu" TEXT NOT NULL,
    "statut" "PositionStatus" NOT NULL DEFAULT 'OUVERT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "scoreGlobal" DOUBLE PRECISION NOT NULL,
    "scoreInstrument" DOUBLE PRECISION NOT NULL,
    "scoreStyle" DOUBLE PRECISION NOT NULL,
    "scoreZone" DOUBLE PRECISION NOT NULL,
    "scoreDisponibilite" DOUBLE PRECISION NOT NULL,
    "scoreNiveau" DOUBLE PRECISION NOT NULL,
    "statut" "MatchStatus" NOT NULL DEFAULT 'PROPOSE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "musician_profiles_userId_key" ON "musician_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_musicianId_positionId_key" ON "matches"("musicianId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_matchId_key" ON "contacts"("matchId");

-- AddForeignKey
ALTER TABLE "musician_profiles" ADD CONSTRAINT "musician_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musician_profiles" ADD CONSTRAINT "musician_profiles_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musician_instruments" ADD CONSTRAINT "musician_instruments_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "musician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musician_styles" ADD CONSTRAINT "musician_styles_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "musician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_musicianProfileId_fkey" FOREIGN KEY ("musicianProfileId") REFERENCES "musician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_profiles" ADD CONSTRAINT "group_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_profiles" ADD CONSTRAINT "group_profiles_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founding_profiles" ADD CONSTRAINT "founding_profiles_founderMusicianId_fkey" FOREIGN KEY ("founderMusicianId") REFERENCES "musician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founding_profiles" ADD CONSTRAINT "founding_profiles_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_groupProfileId_fkey" FOREIGN KEY ("groupProfileId") REFERENCES "group_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_foundingProfileId_fkey" FOREIGN KEY ("foundingProfileId") REFERENCES "founding_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "musician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "open_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "musician_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
