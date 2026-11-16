# pptr — Further Product Information scraper

A Puppeteer tool that pulls AIA HK's "Further Product Information" tables from the UAT site and
writes them into one Excel workbook per target, per report year.

## Language

**Reporting Year**:
The year entered when the program starts. It is a label for output paths and file names only; it never
changes what is scraped.
_Avoid_: Year, report year, 年份

**Policy Year**:
A column label rendered by the site itself (e.g. `Policy year 1 (2024)`). The site derives it from its own
reporting year, so it is one less than the Reporting Year for policy year 1. Never generated or adjusted
by this program.
_Avoid_: Duration, year of policy

**Target**:
One of the three reports this program scrapes: `fulfillment-ratio`, `total-cash-value-ratio`, or
`crediting-interest-rate-history`. A Target maps one-to-one to a source URL and to an output workbook.
_Avoid_: Report, page, category

**Language**:
One of the site's three locales: `en`, `zh-hk`, `zh-cn`. Code always keys on the URL path segment, never on
"TC"/"SC"; those two are sheet names only, and the mapping happens at write time.
_Avoid_: Locale, TC, SC, Chinese

**Product Block**:
One table as the site renders it: the table's title row followed by that table's rows, copied row for row with
no assumption about how many header or data rows it has. A sheet is a sequence of Product Blocks with no blank
rows between them.
_Avoid_: Table, section, group
