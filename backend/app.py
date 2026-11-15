import os
import sys
from datetime import datetime, date
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from openpyxl import load_workbook

# Ensure current directory is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from processor import run, process_uploaded_pdf
from db import (
    get_departments,
    get_supervisors,
    get_hods,
    create_phd_request,
    get_requests,
    get_request_by_id,
    update_request_action
)
from excel_exporter import generate_phd_excel

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATA_FOLDER = os.path.join(BASE_DIR, "data")
EXCEL_FILE = os.path.join(DATA_FOLDER, "VTU_PhD_Registrations.xlsx")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "Jnana Shodha PhD Portal Backend",
        "version": "2.0.0"
    })


# -----------------------------------------------------------------------------
# Metadata Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/departments", methods=["GET"])
def list_departments():
    try:
        departments = get_departments()
        return jsonify({
            "success": True,
            "departments": departments
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/supervisors", methods=["GET"])
def list_supervisors():
    try:
        dept_id = request.args.get("department_id")
        supervisors = get_supervisors(dept_id)
        return jsonify({
            "success": True,
            "supervisors": supervisors
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/hods", methods=["GET"])
def list_hods():
    try:
        dept_id = request.args.get("department_id")
        hods = get_hods(dept_id)
        return jsonify({
            "success": True,
            "hods": hods
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------------------------------------------------------
# Document Upload & OCR Ingestion
# -----------------------------------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload():
    if "files" not in request.files:
        return jsonify({
            "success": False,
            "message": "No files selected"
        }), 400

    uploaded_files = request.files.getlist("files")
    student_id = request.form.get("student_id")
    supervisor_id = request.form.get("supervisor_id")
    department_id = request.form.get("department_id")
    letter_type = request.form.get("letter_type", "provisional_registration")

    pdf_paths = []
    saved_records = []

    for file in uploaded_files:
        if file.filename == "" or not file.filename.lower().endswith(".pdf"):
            continue

        filename = secure_filename(file.filename)
        path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(path)
        pdf_paths.append(path)

        # Process document through OCR engine
        try:
            extracted = process_uploaded_pdf(path)
        except Exception as ocr_err:
            extracted = {
                "source_file": filename,
                "ocr_status": "CHECK",
                "ocr_confidence": 0.0,
                "notes": f"OCR extraction error: {str(ocr_err)}"
            }

        # If student and supervisor IDs are provided, insert into Supabase database
        if student_id and supervisor_id:
            try:
                db_record = create_phd_request(
                    student_id=student_id,
                    supervisor_id=supervisor_id,
                    department_id=department_id,
                    document_name=filename,
                    document_path=path,
                    extracted_data=extracted,
                    ocr_confidence=extracted.get("ocr_confidence", 100.0),
                    ocr_status=extracted.get("ocr_status", "OK"),
                    letter_type=letter_type
                )
                saved_records.append(db_record)
            except Exception as db_err:
                print("DB insert warning:", db_err)

    if not pdf_paths:
        return jsonify({
            "success": False,
            "message": "Please upload valid PDF files"
        }), 400

    # Also sync into local master Excel file for backward compatibility
    try:
        run(pdf_paths, EXCEL_FILE, confirm=False)
    except Exception as xl_err:
        print("Excel sync warning:", xl_err)

    return jsonify({
        "success": True,
        "message": f"Successfully processed {len(pdf_paths)} document(s) and submitted to supervisor for review.",
        "processed_count": len(pdf_paths),
        "requests": saved_records
    })


# -----------------------------------------------------------------------------
# Approval Workflow Endpoints
# -----------------------------------------------------------------------------
@app.route("/api/requests", methods=["GET"])
def fetch_requests():
    role = request.args.get("role", "")
    user_id = request.args.get("user_id")
    department_id = request.args.get("department_id")

    try:
        records = get_requests(role=role, user_id=user_id, department_id=department_id)
        return jsonify({
            "success": True,
            "requests": records
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/requests/<request_id>", methods=["GET"])
def fetch_request_details(request_id):
    try:
        rec = get_request_by_id(request_id)
        if not rec:
            return jsonify({"success": False, "message": "Request not found"}), 404
        return jsonify({
            "success": True,
            "request": rec
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/requests/<request_id>/action", methods=["POST"])
def handle_request_action(request_id):
    data = request.get_json() or {}
    role = data.get("role")
    action = data.get("action")  # 'accept' or 'decline'
    remarks = data.get("remarks", "")
    hod_id = data.get("hod_id")  # optional: supervisor picks HOD

    if not role or not action:
        return jsonify({
            "success": False,
            "message": "Both role and action ('accept' or 'decline') are required."
        }), 400

    try:
        updated = update_request_action(request_id, role, action, remarks, hod_id=hod_id)
        return jsonify({
            "success": True,
            "message": f"Action '{action}' successfully recorded by {role}.",
            "request": updated
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------------------------------------------------------
# Scoped Excel Export
# -----------------------------------------------------------------------------
@app.route("/api/export-excel", methods=["GET"])
def export_excel():
    role = request.args.get("role", "principal")
    user_id = request.args.get("user_id")
    department_id = request.args.get("department_id")

    try:
        records = get_requests(role=role, user_id=user_id, department_id=department_id)
        excel_stream = generate_phd_excel(records)
        filename = f"PhD_Registrations_{role.capitalize()}.xlsx"

        return send_file(
            excel_stream,
            as_attachment=True,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------------------------------------------------------
# Legacy Endpoints (Maintained for backward compatibility)
# -----------------------------------------------------------------------------
@app.route("/download")
def download():
    if not os.path.exists(EXCEL_FILE):
        return "Excel file not found", 404

    return send_file(
        EXCEL_FILE,
        as_attachment=True,
        download_name="VTU_PhD_Registrations.xlsx"
    )


@app.route("/records", methods=["GET"])
def get_records():
    if not os.path.exists(EXCEL_FILE):
        return jsonify({"success": False, "message": "Excel file not found"}), 404

    try:
        workbook = load_workbook(EXCEL_FILE, read_only=True, data_only=True)
        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))

        if not rows:
            workbook.close()
            return jsonify({"headers": [], "records": []})

        headers = [str(v) if v is not None else "" for v in rows[0]]
        records = []

        for row in rows[1:]:
            if all(v is None for v in row):
                continue
            formatted_row = []
            for v in row:
                if isinstance(v, (datetime, date)):
                    v = v.isoformat()
                elif v is None:
                    v = ""
                else:
                    v = str(v)
                formatted_row.append(v)
            records.append(formatted_row)

        workbook.close()
        return jsonify({"headers": headers, "records": records})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
