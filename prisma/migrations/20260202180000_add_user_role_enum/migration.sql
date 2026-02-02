-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CONTRIBUTOR', 'ROUTE_SETTER', 'ADMIN');

-- AlterTable: Add role column with default
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CONTRIBUTOR';

-- AlterTable: Remove old role_flags column
ALTER TABLE "users" DROP COLUMN "role_flags";
