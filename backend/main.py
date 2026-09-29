
from data_extractor import extract_student_data
from fastapi import FastAPI, UploadFile, File, HTTPException
import pdfplumber
import pytesseract
import pypdfium2 as pdfium
import io


app = FastAPI()

# Windows Tesseract installation path
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


@app.get("/")
def home():
    return {"message": "PhD Scholar Backend Running!"}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file"
        )

    contents = await file.read()
    extracted_pages = []

    try:
        # First try normal text extraction
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                extracted_pages.append(
                    page.extract_text() or ""
                )

        # OCR only pages without embedded text
        if any(not text.strip() for text in extracted_pages):
            pdf = pdfium.PdfDocument(contents)

            try:
                for i, text in enumerate(extracted_pages):
                    if not text.strip():
                        page = pdf[i]
                        bitmap = page.render(scale=3)
                        image = bitmap.to_pil()

                        extracted_pages[i] = (
                            pytesseract.image_to_string(
                                image,
                                lang="eng"
                            )
                        )
            finally:
                pdf.close()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"PDF processing failed: {str(e)}"
        )

    extracted_text = "\n".join(extracted_pages)

    student_data = extract_student_data(extracted_text)

    return {
        "message": "Student data extracted successfully",
        "filename": file.filename,
        "student": student_data
    }
  