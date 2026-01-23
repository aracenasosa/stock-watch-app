-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "targetPrice" REAL NOT NULL,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("createdAt", "id", "isTriggered", "symbol", "targetPrice", "triggeredAt", "userId") SELECT "createdAt", "id", "isTriggered", "symbol", "targetPrice", "triggeredAt", "userId" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_userId_symbol_idx" ON "Alert"("userId", "symbol");
CREATE INDEX "Alert_symbol_isTriggered_idx" ON "Alert"("symbol", "isTriggered");
CREATE UNIQUE INDEX "Alert_userId_symbol_targetPrice_isTriggered_key" ON "Alert"("userId", "symbol", "targetPrice", "isTriggered");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
