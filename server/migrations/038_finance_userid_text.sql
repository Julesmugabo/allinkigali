-- 038_finance_userid_text.sql — Change user-reference columns from INT to TEXT
-- to match the UUID primary key on the users table

ALTER TABLE fin_transactions ALTER COLUMN created_by TYPE TEXT USING created_by::text;
ALTER TABLE fin_transactions ALTER COLUMN approved_by TYPE TEXT USING approved_by::text;
ALTER TABLE fin_transactions ALTER COLUMN voided_by TYPE TEXT USING voided_by::text;

ALTER TABLE fin_invoices ALTER COLUMN created_by TYPE TEXT USING created_by::text;
ALTER TABLE fin_invoices ALTER COLUMN approved_by TYPE TEXT USING approved_by::text;

ALTER TABLE fin_invoice_payments ALTER COLUMN created_by TYPE TEXT USING created_by::text;

ALTER TABLE fin_documents ALTER COLUMN uploaded_by TYPE TEXT USING uploaded_by::text;

ALTER TABLE fin_audit_log ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE fin_budgets ALTER COLUMN approved_by TYPE TEXT USING approved_by::text;
ALTER TABLE fin_budgets ALTER COLUMN created_by TYPE TEXT USING created_by::text;
