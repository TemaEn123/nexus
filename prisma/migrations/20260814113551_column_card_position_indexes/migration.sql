-- DropIndex
DROP INDEX "Card_columnId_idx";

-- DropIndex
DROP INDEX "Column_boardId_idx";

-- CreateIndex
CREATE INDEX "Card_columnId_position_idx" ON "Card"("columnId", "position");

-- CreateIndex
CREATE INDEX "Column_boardId_position_idx" ON "Column"("boardId", "position");
