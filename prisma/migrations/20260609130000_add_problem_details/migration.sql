-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "faulty_bolt" BOOLEAN,
ADD COLUMN     "faulty_anchor" BOOLEAN,
ADD COLUMN     "dangerous_clipping" BOOLEAN,
ADD COLUMN     "loose_rock" BOOLEAN;
