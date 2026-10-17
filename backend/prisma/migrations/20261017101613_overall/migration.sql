-- CreateTable
CREATE TABLE "OverallEntry" (
    "id" SERIAL NOT NULL,
    "sportId" INTEGER,
    "departmentId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverallEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OverallEntry" ADD CONSTRAINT "OverallEntry_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverallEntry" ADD CONSTRAINT "OverallEntry_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
