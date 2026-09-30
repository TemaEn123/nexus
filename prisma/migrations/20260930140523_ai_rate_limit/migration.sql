-- CreateTable
CREATE TABLE "AiRateLimit" (
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "AiRateLimit_pkey" PRIMARY KEY ("userId","windowStart")
);

-- AddForeignKey
ALTER TABLE "AiRateLimit" ADD CONSTRAINT "AiRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
