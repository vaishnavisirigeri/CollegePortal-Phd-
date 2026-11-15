import os
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

NAVY = PatternFill("solid", fgColor="1F2A44")
CHECK_FILL = PatternFill("solid", fgColor="FFF2CC")
EMPTY_FILL = PatternFill("solid", fgColor="F8CBAD")
APPROVED_FILL = PatternFill("solid", fgColor="D9EAD3")
NO_FILL = PatternFill(fill_type=None)
THIN = Side(style="thin", color="808080")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

HEADERS = [
    "Submission Date",
    "Student Name",
    "USN",
    "Department",
    "Supervisor",
    "Letter No",
    "Letter Date",
    "Admission Category",
    "Faculty",
    "Research Center",
    "Specialization",
    "Proposed Research Topic",
    "Status",
    "Current Stage",
    "Supervisor Remarks",
    "HOD Remarks",
    "Principal Remarks",
    "OCR Status"
]

WIDTHS = [18, 26, 18, 16, 26, 30, 16, 20, 24, 30, 28, 40, 20, 16, 26, 26, 26, 14]

def generate_phd_excel(requests):
    wb = Workbook()
    ws = wb.active
    ws.title = "PhD Submissions"

    # Header row
    for c, h in enumerate(HEADERS, 1):
        cell = ws.cell(1, c, h)
        cell.font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
        cell.fill = NAVY
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        cell.border = BORDER
        ws.column_dimensions[cell.column_letter].width = WIDTHS[c - 1]

    ws.row_dimensions[1].height = 36
    ws.freeze_panes = "A2"

    # Data rows
    for r_idx, req in enumerate(requests, 2):
        ext = req.get("extracted_data") or {}
        if isinstance(ext, str):
            import json
            try:
                ext = json.loads(ext)
            except Exception:
                ext = {}

        fields = ext.get("fields") or ext

        created_str = str(req.get("created_at") or "")[:10]
        status = req.get("status", "")
        ocr_status = req.get("ocr_status", "OK")

        row_vals = [
            created_str,
            req.get("student_name") or fields.get("name", ""),
            req.get("student_usn") or fields.get("usn", ""),
            req.get("department_code") or "",
            req.get("supervisor_name") or fields.get("supervisor", ""),
            ext.get("Letter No") or fields.get("letter_no", ""),
            ext.get("Letter Date") or fields.get("letter_date", ""),
            fields.get("category", ""),
            fields.get("faculty", ""),
            fields.get("centre", ""),
            fields.get("spec", ""),
            fields.get("topic", ""),
            status.replace("_", " ").upper(),
            (req.get("current_stage") or "").upper(),
            req.get("supervisor_remarks") or "",
            req.get("hod_remarks") or "",
            req.get("principal_remarks") or "",
            ocr_status
        ]

        is_check = (ocr_status == "CHECK")
        is_approved = ("approved" in status.lower())
        max_lines = 1

        for c_idx, val in enumerate(row_vals, 1):
            cell = ws.cell(r_idx, c_idx, str(val or ""))
            cell.font = Font(name="Calibri", size=11)
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.border = BORDER

            if c_idx == 3:  # USN
                cell.number_format = "@"

            if is_approved:
                cell.fill = APPROVED_FILL
            elif is_check:
                cell.fill = CHECK_FILL
            else:
                cell.fill = NO_FILL

            val_str = str(val or "")
            width = WIDTHS[c_idx - 1]
            lines = sum(max(1, -(-len(ln) // int(width * 1.1))) for ln in val_str.split("\n"))
            max_lines = max(max_lines, lines)

        ws.row_dimensions[r_idx].height = max(20, 16 * max_lines + 4)

    if ws.max_row > 1:
        last_col = ws.cell(1, len(HEADERS)).column_letter
        ws.auto_filter.ref = f"A1:{last_col}{ws.max_row}"

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output
