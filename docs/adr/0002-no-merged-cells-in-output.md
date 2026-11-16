# Output sheets do not reproduce the merged cells of the hand-made workbook

The existing workbooks in `output/2025/` were produced by pasting scraped HTML into Excel. They contain 569
merged cells, mostly long title rows spanning the table width. Our writer deliberately does not reproduce
them: a title goes in column A as plain text and the sheet carries bold headers and number formats, nothing
more. Reverse-engineering the merge geometry of a file we are replacing would cost more than it buys, and the
values — which is what the report is actually read for — are identical either way.

## Consequences

- New workbooks will not look byte-identical to the 2025 files, so a visual diff will show differences. Diff
  the cell values instead.
- Title rows read as overflowing text in column A rather than centred across the sheet.
