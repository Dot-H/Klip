/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Post";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role_flags" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinators" (
    "user_id" TEXT NOT NULL,
    "crag_id" TEXT NOT NULL,

    CONSTRAINT "coordinators_pkey" PRIMARY KEY ("user_id","crag_id")
);

-- CreateTable
CREATE TABLE "crags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "convention" BOOLEAN,

    CONSTRAINT "crags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "crag_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geoloc_flags" TEXT,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "orientation" SMALLINT,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pitches" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "description" TEXT,
    "length" INTEGER,
    "nb_bolts" INTEGER,

    CONSTRAINT "pitches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reported_pitch_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "visual_check" BOOLEAN,
    "anchor_check" BOOLEAN,
    "cleaning_done" BOOLEAN,
    "trundle_done" BOOLEAN,
    "total_rebolting_done" BOOLEAN,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "coordinators" ADD CONSTRAINT "coordinators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinators" ADD CONSTRAINT "coordinators_crag_id_fkey" FOREIGN KEY ("crag_id") REFERENCES "crags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_crag_id_fkey" FOREIGN KEY ("crag_id") REFERENCES "crags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pitches" ADD CONSTRAINT "pitches_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_pitch_id_fkey" FOREIGN KEY ("reported_pitch_id") REFERENCES "pitches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
