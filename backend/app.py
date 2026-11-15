from flask import Flask, render_template, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename

# Import your existing backend
from processor import run

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
DATA_FOLDER = "data"

EXCEL_FILE = os.path.join(
    DATA_FOLDER,
    "VTU_PhD_Registrations.xlsx"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

print("Excel file location:", os.path.abspath(EXCEL_FILE))
print("Excel file exists:", os.path.exists(EXCEL_FILE))

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)


@app.route("/")
def home():

    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():

    if "files" not in request.files:

        return jsonify({
            "success": False,
            "message": "No files selected"
        }), 400

    uploaded_files = request.files.getlist("files")

    pdf_paths = []

    for file in uploaded_files:

        if file.filename == "":
            continue

        if not file.filename.lower().endswith(".pdf"):
            continue

        filename = secure_filename(file.filename)

        path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        file.save(path)

        pdf_paths.append(path)

    if not pdf_paths:

        return jsonify({
            "success": False,
            "message": "Please upload valid PDF files"
        }), 400

    try:

        # Process PDFs and append records
        result = run(
            pdf_paths,
            EXCEL_FILE,
            confirm=False
        )

        if result is None:

            return jsonify({
                "success": True,
                "message": "No new records were added. Check for duplicate USNs or extraction errors."
            })

        return jsonify({
            "success": True,
            "message": "PDFs processed successfully!",
            "download": "/download"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/download")
def download():

    if not os.path.exists(EXCEL_FILE):

        return "Excel file not found", 404

    return send_file(
        EXCEL_FILE,
        as_attachment=True,
        download_name="VTU_PhD_Registrations.xlsx"
    )
from openpyxl import load_workbook
from datetime import datetime, date

@app.route("/records", methods=["GET"])
def get_records():

    if not os.path.exists(EXCEL_FILE):
        return jsonify({
            "success": False,
            "message": "Excel file not found"
        }), 404

    try:
        workbook = load_workbook(EXCEL_FILE, read_only=True, data_only=True)
        sheet = workbook.active

        rows = list(sheet.iter_rows(values_only=True))

        if not rows:
            workbook.close()
            return jsonify({
                "headers": [],
                "records": []
            })

        headers = [
            str(value) if value is not None else ""
            for value in rows[0]
        ]

        records = []

        for row in rows[1:]:
            if all(value is None for value in row):
                continue

            formatted_row = []

            for value in row:
                if isinstance(value, (datetime, date)):
                    value = value.isoformat()
                elif value is None:
                    value = ""
                else:
                    value = str(value)

                formatted_row.append(value)

            records.append(formatted_row)

        workbook.close()

        return jsonify({
            "headers": headers,
            "records": records
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

if __name__ == "__main__":

    app.run(debug=True)