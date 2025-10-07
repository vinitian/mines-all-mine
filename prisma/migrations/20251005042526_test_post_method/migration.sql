/*
  Warnings:

  - Added the required column `host` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Room" DROP CONSTRAINT "Room_id_fkey";

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "host" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roomId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
