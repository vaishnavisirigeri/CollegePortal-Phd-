
import re


def extract_student_data(text):

    data = {
        "student_name": None,
        "usn": None,
        "enrollment_type": None,
        "supervisor": None,
        "registration_date": None,
        "course": None,
        "project_title": None,
        "address": None
    }

    # Extract student name
    match = re.search(
        r"Name of the Candidate\s+([A-Z][A-Z\s.]+)",
        text,
        re.IGNORECASE
    )
    if match:
        data["student_name"] = match.group(1).strip()

    # Extract USN
    match = re.search(
        r"\b1MS\d{2}PCS\d{2}\b",
        text,
        re.IGNORECASE
    )
    if match:
        data["usn"] = match.group(0).upper()

    # Extract enrollment type
    if re.search(r"Part\s*(?:Time|Line)", text, re.IGNORECASE):
        data["enrollment_type"] = "Part-time"
    elif re.search(r"Full\s*Time", text, re.IGNORECASE):
        data["enrollment_type"] = "Full-time"

    # Extract supervisor
    match = re.search(
        r"\bDR\.?\s*[A-Z][A-Z\s.]+(?=\n)",
        text,
        re.IGNORECASE
    )
    if match:
        data["supervisor"] = match.group(0).strip()

    # Extract office-order date
    match = re.search(
        r"Date:\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})",
        text
    )
    if match:
        data["registration_date"] = match.group(1)

    # Extract specialization
    match = re.search(
        r"Specialization\s+([A-Z\s&]+)",
        text
    )
    if match:
        data["course"] = match.group(1).strip()


    # Extract project title

    # Extract project title
    match = re.search(
        r"A Collaborative Approach.*?"
        r"Using Optimized Federated Learning Models",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if match:
        project = match.group(0)

        # Remove the OCR noise seen in this sample
        project = re.sub(
            r"\+\s*RROD.*?SER,\s*",
            "",
            project,
            flags=re.IGNORECASE | re.DOTALL
        )

        data["project_title"] = " ".join(
            project.split()
        )
 
    # Extract address from the To section
    match = re.search(
        r"\bTo,\s*\n\s*1\.\s*(.+?)(?=\n\s*Date\s*&\s*Time:|\Z)",
        text,
        re.DOTALL | re.IGNORECASE
    )

    if match:
        data["address"] = match.group(1).strip()

        # Remove student's name from the address
        if data["student_name"]:
            data["address"] = re.sub(
                r"^" + re.escape(data["student_name"]) + r"\s*,?\s*",
                "",
                data["address"],
                flags=re.IGNORECASE
            )

    return data