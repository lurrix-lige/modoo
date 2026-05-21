-- Create unique index on CheckIn(anonymousId, date)
-- This prevents duplicate check-ins for the same anonymous user on the same date
CREATE UNIQUE INDEX "check_ins_anonymousId_date_key" ON "check_ins"("anonymousId", "date");
