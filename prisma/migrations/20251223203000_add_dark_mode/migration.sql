-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'settings',
    "initialBalance" REAL NOT NULL DEFAULT 0,
    "darkMode" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Settings" ("id", "initialBalance") SELECT "id", "initialBalance" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
