CREATE TABLE "StudentPayment" (
  "id" TEXT NOT NULL, "studentId" TEXT NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
  "receiptNumber" TEXT NOT NULL, "receivedOn" DATE NOT NULL, "remarks" TEXT,
  "receivedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentPayment_amount_check" CHECK ("amount" > 0)
);
CREATE UNIQUE INDEX "StudentPayment_receiptNumber_key" ON "StudentPayment"("receiptNumber");
CREATE INDEX "StudentPayment_studentId_receivedOn_idx" ON "StudentPayment"("studentId", "receivedOn");
ALTER TABLE "StudentPayment" ADD CONSTRAINT "StudentPayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
