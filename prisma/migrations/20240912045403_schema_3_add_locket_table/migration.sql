/*
  Warnings:

  - You are about to alter the column `createdAt` on the `queue` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - Added the required column `locket_id` to the `queue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `queue` ADD COLUMN `locket_id` INTEGER NOT NULL,
    MODIFY `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE `lockets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(225) NOT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `queue` ADD CONSTRAINT `queue_locket_id_fkey` FOREIGN KEY (`locket_id`) REFERENCES `lockets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
