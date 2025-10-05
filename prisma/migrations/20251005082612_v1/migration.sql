/*
  Warnings:

  - You are about to drop the column `host` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[host_id]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `host_id` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `img_url` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_roomId_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "host",
ADD COLUMN     "bomb_count" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "host_id" INTEGER NOT NULL,
ADD COLUMN     "placement" INTEGER[],
ADD COLUMN     "player_id_list" INTEGER[],
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "timer" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roomId",
ADD COLUMN     "img_url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_host_id_key" ON "Room"("host_id");
