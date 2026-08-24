-- DropIndex
DROP INDEX "Card_columnId_position_idx";

-- DropIndex
DROP INDEX "Column_boardId_position_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Card_columnId_position_key" ON "Card"("columnId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Column_boardId_position_key" ON "Column"("boardId", "position");
