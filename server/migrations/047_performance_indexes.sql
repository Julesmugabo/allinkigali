-- Indexes for the lookups the app and portal run most, so they stop
-- scanning whole tables as the data grows.

-- News feed: published, not archived, newest first; live-story grouping.
create index if not exists idx_news_articles_feed on news_articles (status, published_at desc) where not is_archived;
create index if not exists idx_news_articles_story on news_articles (story_id);

-- Finance: journal/invoice detail lines, reports by status and date,
-- budgets by category account, reconciliation by bank account.
create index if not exists idx_fin_journal_lines_txn on fin_journal_lines (transaction_id);
create index if not exists idx_fin_journal_lines_account on fin_journal_lines (account_id);
create index if not exists idx_fin_invoice_lines_invoice on fin_invoice_lines (invoice_id);
create index if not exists idx_fin_invoice_payments_invoice on fin_invoice_payments (invoice_id);
create index if not exists idx_fin_txn_status_date on fin_transactions (status, txn_date);
create index if not exists idx_fin_txn_category on fin_transactions (category_account_id);
create index if not exists idx_fin_txn_bank on fin_transactions (bank_account_id) where status = 'posted' and not reconciled;
create index if not exists idx_fin_invoices_type_status on fin_invoices (invoice_type, status);
create index if not exists idx_fin_budget_lines_budget on fin_budget_lines (budget_id);

-- Coffee shop menus (restaurants already have theirs).
create index if not exists idx_coffee_menu_shop on coffee_shop_menu_items (coffee_shop_id);
