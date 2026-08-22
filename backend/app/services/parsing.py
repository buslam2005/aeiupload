import csv
import io
from datetime import date, datetime

from openpyxl import load_workbook

# Maps an uploaded file's own header names to upload_students' business
# columns, per requirements.md's "upload file field mapping" section - the
# file's headers are human-readable labels (e.g. "NMC PIN", "Course Code"),
# not the internal nmc_* names. "Previous Institute Code" has no table field
# and is intentionally omitted (dropped at parse time). A row missing a column
# here just gets None for it, which surfaces naturally as a mismatch (or, for
# nmc_nmcpin, as "record not found") during matching - no separate validation
# step needed at parse time.
FILE_COLUMN_TO_FIELD = {
    "NMC PIN": "nmc_nmcpin",
    "Title": "nmc_nmctitlename",
    "First Name": "nmc_firstname",
    "Middle Name": "nmc_maidenname",
    "Last Name": "nmc_lastname",
    "Date of Birth": "nmc_dateofbirth",
    "Gender": "nmc_gender",
    "Nationality": "nmc_nationalityname",
    "Place of Birth": "nmc_countryofbirthname",
    "Email Address": "nmc_email",
    "Address Line 1": "nmc_addressline1",
    "Address Line 2": "nmc_addressline2",
    "Address Line 3": "nmc_addressline3",
    "City": "nmc_city",
    "Postcode": "nmc_postcode",
    "Country": "nmc_countryname",
    "Institute Code": "nmc_traininginstitutecode",
    "Training Type": "nmc_trainingtype",
    "Course Code": "nmc_programme",
    "Academic Level": "nmc_academicroute",
    "Course Start Date": "nmc_coursestartdate",
    "Course End Date": "nmc_courseenddate",
    "Pass Date": "nmc_trainingexampassdate",
    "Start Date": "nmc_trainingstartdate",
    "End Date": "nmc_trainingcompletiondate",
}


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
        cleaned = {
            field: _clean_cell(raw_row.get(file_column))
            for file_column, field in FILE_COLUMN_TO_FIELD.items()
        }
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
        cleaned = {
            field: _clean_cell(raw_row.get(file_column))
            for file_column, field in FILE_COLUMN_TO_FIELD.items()
        }
        if any(cleaned.values()):
            rows.append(cleaned)
    return rows
