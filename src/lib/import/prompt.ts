/* The exact prompt shown by the "Copy prompt" button in Settings → Import
   data. Kept as one constant so the UI and any docs stay in sync: this
   text is the single source of truth for the CSV shape the importer
   accepts (see build-plan.ts). */

export const DATA_IMPORT_PROMPT = `You are converting my agency's business records into 4 CSV files for import into a project-profitability tool. Use exactly these filenames, headers, and column order. Do not add, rename, or reorder columns.

If something in my data is ambiguous or missing a required field, list your assumptions at the end instead of silently guessing, especially for money amounts and dates.

=== clients.csv ===
client_ref,company_name,name,email,phone,address,city,country
- client_ref: any short unique code YOU invent for this file (e.g. C1, C2), used only to link projects below, not stored anywhere.
- company_name and name are both required. name = the contact person, company_name = their business.
- email is required; leave blank if truly unknown, don't invent one.

=== projects.csv ===
project_ref,client_ref,name,service,status,contract_value,team_cost,start_date,deadline,progress_percentage
- project_ref: short unique code (P1, P2...). client_ref must match a row above.
- service: one of exactly: web_dev, design, marketing, consulting, other (pick the closest match).
- status: one of exactly: active, in_review, delivered, closed
- contract_value: total deal value, plain number, no currency symbol or commas.
- team_cost: estimated internal labour cost for the project, plain number (0 if unknown).
- start_date, deadline: YYYY-MM-DD, or blank if unknown.
- progress_percentage: 0-100 integer (100 if status is delivered or closed).

=== invoices.csv ===
invoice_ref,project_ref,invoice_number,issue_date,due_date,status,tax_rate_pct,line_description,quantity,unit_price
- invoice_ref: short unique code (I1, I2...). Repeat the SAME invoice_ref on multiple rows if one invoice has multiple line items.
- project_ref must match a row above. invoice_number: their existing invoice number if they have one, else leave blank.
- status: one of exactly: draft, sent, cancelled ("paid" is worked out automatically from payments.csv below; do not write "paid" here).
- issue_date, due_date: YYYY-MM-DD if you know them. If only one is known, leave the other blank; it will be filled in from the one you gave. If NEITHER is known, leave both blank rather than guessing; they'll default to today's date, which is safer than inventing a fake historical date.
- tax_rate_pct: single tax rate 0-100 (e.g. 18 for 18% GST), 0 if none.
- quantity, unit_price: plain numbers, no currency symbols or commas.

=== payments.csv ===
invoice_ref,amount,payment_date,payment_method,reference_number
- invoice_ref must match a row in invoices.csv.
- payment_method: one of exactly: bank_transfer, card, cheque, cash, other (map UPI/wallet/net-banking payments to bank_transfer).
- payment_date: YYYY-MM-DD; this one CANNOT be left blank or defaulted, because it drives cash-flow and days-to-pay reporting directly, and a wrong date would misstate real revenue history. If you don't have the exact date, use the best estimate you can from context (the month it was mentioned in, the invoice's due date, a bank statement period, month-end, etc.) and note the estimate under "Assumptions I made" below; never invent a payment that isn't real, but do your best on its date rather than dropping the row.

Output all 4 files in full, ready to copy, each in its own code block. Then a short "Assumptions I made" list, then a short "Data I couldn't confidently map" list if anything was skipped.

My raw data follows:
[PASTE YOUR SPREADSHEET, EXPORT, OR NOTES HERE]`;
