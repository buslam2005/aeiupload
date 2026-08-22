import csv
import io
from datetime import date, datetime

from openpyxl import load_workbook

# Column names expected in an uploaded file's header row - mirrors the business
# columns shared with master_students (nmc_nmcpin is the lookup key, not a
# match-checked field). A row missing a column here just gets None for it, which
# surfaces naturally as a mismatch (or, for nmc_nmcpin, as "record not found")
# during matching - no separate validation step needed at parse time.
UPLOAD_COLUMNS = [
    "nmc_nmcpin",
    "nmc_nmctitlename",
    "nmc_firstname",
    "nmc_maidenname",
    "nmc_lastname",
    "nmc_dateofbirth",
    "nmc_gender",
    "nmc_nationalityname",
    "nmc_countryofbirthname",
    "nmc_email",
    "nmc_addressline1",
    "nmc_addressline2",
    "nmc_addressline3",
    "nmc_city",
    "nmc_postcode",
    "nmc_countryname",
    "nmc_traininginstitutecode",
    "nmc_trainingtype",
    "nmc_programme",
    "nmc_academicroute",
    "nmc_coursestartdate",
    "nmc_courseenddate",
    "nmc_trainingexampassdate",
    "nmc_trainingstartdate",
    "nmc_trainingcompletiondate",
]


class UnsupportedFileTypeError(ValueError):
    pass


def parse_upload_file(filename: str, content: bytes) -> list[dict[str, str | None]]:
    """Parse a .csv or .xlsx upload into a list of row dicts (one per data row,
    in file order, header/blank rows excluded), keyed by UPLOAD_COLUMNS.
    """
    lower = filename.lower()
    if lower.endswith(".csv"):
        return _parse_csv(content)
    if lower.endswith(".xlsx"):
        return _parse_xlsx(content)
    raise UnsupportedFileTypeError(f"Unsupported file type: {filename}")


def _clean_cell(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y%m%d")
    text = str(value).strip()
    return text or None


def _parse_csv(content: bytes) -> list[dict[str, str | None]]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for raw_row in reader:
        cleaned = {key: _clean_cell(raw_row.get(key)) for key in UPLOAD_COLUMNS}
        if any(cleaned.values()):
            rows.append(cleaned)
    return rows


def _parse_xlsx(content: bytes) -> list[dict[str, str | None]]:
    workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    sheet = workbook.active
    rows_iter = sheet.iter_rows(values_only=True)
    header = [str(h).strip() if h is not None else "" for h in next(rows_iter)]

    rows = []
    for raw in rows_iter:
        raw_row = dict(zip(header, raw))
        cleaned = {key: _clean_cell(raw_row.get(key)) for key in UPLOAD_COLUMNS}
        if any(cleaned.values()):
            rows.append(cleaned)
    return rows
