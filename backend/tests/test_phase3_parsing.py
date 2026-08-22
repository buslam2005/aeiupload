import io
from datetime import date

import pytest
from openpyxl import Workbook

from app.services.parsing import UnsupportedFileTypeError, parse_upload_file

CSV_HEADER = "nmc_nmcpin,nmc_firstname,nmc_lastname,nmc_traininginstitutecode"


def test_parse_csv_basic_rows():
    content = (CSV_HEADER + "\n16H0404E,ROSE 1,LEE,1315\n16H0405E,ROSE 2,LEE,1315\n").encode()
    rows = parse_upload_file("students.csv", content)
    assert len(rows) == 2
    assert rows[0]["nmc_nmcpin"] == "16H0404E"
    assert rows[0]["nmc_firstname"] == "ROSE 1"
    # columns absent from the file default to None rather than raising
    assert rows[0]["nmc_dateofbirth"] is None


def test_parse_csv_skips_trailing_blank_lines():
    content = (CSV_HEADER + "\n16H0404E,ROSE 1,LEE,1315\n\n\n").encode()
    rows = parse_upload_file("students.csv", content)
    assert len(rows) == 1


def test_parse_csv_trims_whitespace():
    content = (CSV_HEADER + "\n 16H0404E , ROSE 1 ,LEE,1315\n").encode()
    rows = parse_upload_file("students.csv", content)
    assert rows[0]["nmc_nmcpin"] == "16H0404E"
    assert rows[0]["nmc_firstname"] == "ROSE 1"


def test_parse_xlsx_basic_rows_and_date_conversion():
    wb = Workbook()
    ws = wb.active
    ws.append(["nmc_nmcpin", "nmc_firstname", "nmc_lastname", "nmc_dateofbirth"])
    ws.append(["16H0404E", "ROSE 1", "LEE", date(2002, 5, 24)])
    ws.append(["16H0405E", "ROSE 2", "LEE", "20040321"])
    buf = io.BytesIO()
    wb.save(buf)

    rows = parse_upload_file("students.xlsx", buf.getvalue())
    assert len(rows) == 2
    assert rows[0]["nmc_dateofbirth"] == "20020524"
    assert rows[1]["nmc_dateofbirth"] == "20040321"


def test_parse_xlsx_skips_fully_blank_rows():
    wb = Workbook()
    ws = wb.active
    ws.append(["nmc_nmcpin", "nmc_firstname"])
    ws.append(["16H0404E", "ROSE 1"])
    ws.append([None, None])
    ws.append(["16H0405E", "ROSE 2"])
    buf = io.BytesIO()
    wb.save(buf)

    rows = parse_upload_file("students.xlsx", buf.getvalue())
    assert len(rows) == 2


def test_unsupported_extension_raises():
    with pytest.raises(UnsupportedFileTypeError):
        parse_upload_file("students.txt", b"whatever")
