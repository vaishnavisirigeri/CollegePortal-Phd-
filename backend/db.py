import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DB_URI = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres.jamisjqwkocawossrmky:Keerthana1Vaishnavi2@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
)

def get_connection():
    return psycopg2.connect(DB_URI, cursor_factory=RealDictCursor)

def get_departments():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, code FROM public.departments ORDER BY code ASC;")
            return cur.fetchall()

def get_hods(department_id=None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            if department_id:
                cur.execute(
                    """
                    SELECT p.id, p.username, p.full_name, p.email, p.role, p.department_id, p.designation, d.name as department_name, d.code as department_code
                    FROM public.profiles p
                    LEFT JOIN public.departments d ON p.department_id = d.id
                    WHERE p.role = 'hod' AND p.department_id = %s
                    ORDER BY p.full_name ASC;
                    """,
                    (department_id,)
                )
            else:
                cur.execute(
                    """
                    SELECT p.id, p.username, p.full_name, p.email, p.role, p.department_id, p.designation, d.name as department_name, d.code as department_code
                    FROM public.profiles p
                    LEFT JOIN public.departments d ON p.department_id = d.id
                    WHERE p.role = 'hod'
                    ORDER BY p.full_name ASC;
                    """
                )
            return cur.fetchall()

def get_supervisors(department_id=None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            if department_id:
                cur.execute(
                    """
                    SELECT p.id, p.username, p.full_name, p.email, p.role, p.department_id, p.designation, d.name as department_name, d.code as department_code
                    FROM public.profiles p
                    LEFT JOIN public.departments d ON p.department_id = d.id
                    WHERE p.role = 'supervisor' AND p.department_id = %s
                    ORDER BY p.full_name ASC;
                    """,
                    (department_id,)
                )
            else:
                cur.execute(
                    """
                    SELECT p.id, p.username, p.full_name, p.email, p.role, p.department_id, p.designation, d.name as department_name, d.code as department_code
                    FROM public.profiles p
                    LEFT JOIN public.departments d ON p.department_id = d.id
                    WHERE p.role = 'supervisor'
                    ORDER BY p.full_name ASC;
                    """
                )
            return cur.fetchall()

def create_phd_request(
    student_id,
    supervisor_id,
    department_id,
    document_name,
    document_path,
    extracted_data,
    ocr_confidence=100.0,
    ocr_status="OK",
    letter_type="provisional_registration"
):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.phd_requests (
                    student_id,
                    supervisor_id,
                    department_id,
                    letter_type,
                    document_name,
                    document_path,
                    extracted_data,
                    ocr_confidence,
                    ocr_status,
                    current_stage,
                    status
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, 'supervisor', 'pending_supervisor'
                )
                RETURNING *;
                """,
                (
                    student_id,
                    supervisor_id,
                    department_id,
                    letter_type,
                    document_name,
                    document_path,
                    json.dumps(extracted_data),
                    ocr_confidence,
                    ocr_status
                )
            )
            return cur.fetchone()

def get_requests(role, user_id=None, department_id=None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            base_sql = """
                SELECT 
                    r.*,
                    s.full_name as student_name,
                    s.email as student_email,
                    s.usn as student_usn,
                    sup.full_name as supervisor_name,
                    sup.email as supervisor_email,
                    d.name as department_name,
                    d.code as department_code
                FROM public.phd_requests r
                LEFT JOIN public.profiles s ON r.student_id = s.id
                LEFT JOIN public.profiles sup ON r.supervisor_id = sup.id
                LEFT JOIN public.departments d ON r.department_id = d.id
            """

            role_lower = (role or "").lower()

            if role_lower == "student":
                cur.execute(base_sql + " WHERE r.student_id = %s ORDER BY r.created_at DESC;", (user_id,))
            elif role_lower == "supervisor":
                cur.execute(base_sql + " WHERE r.supervisor_id = %s ORDER BY r.created_at DESC;", (user_id,))
            elif role_lower == "hod":
                if user_id:
                    # HOD sees requests explicitly forwarded to them
                    cur.execute(base_sql + " WHERE r.hod_id = %s ORDER BY r.created_at DESC;", (user_id,))
                elif department_id:
                    cur.execute(base_sql + " WHERE r.department_id = %s ORDER BY r.created_at DESC;", (department_id,))
                else:
                    cur.execute(base_sql + " ORDER BY r.created_at DESC;")
            elif role_lower == "principal":
                cur.execute(base_sql + " ORDER BY r.created_at DESC;")
            else:
                return []

            return cur.fetchall()

def get_request_by_id(request_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    r.*,
                    s.full_name as student_name,
                    s.email as student_email,
                    s.usn as student_usn,
                    sup.full_name as supervisor_name,
                    sup.email as supervisor_email,
                    d.name as department_name,
                    d.code as department_code
                FROM public.phd_requests r
                LEFT JOIN public.profiles s ON r.student_id = s.id
                LEFT JOIN public.profiles sup ON r.supervisor_id = sup.id
                LEFT JOIN public.departments d ON r.department_id = d.id
                WHERE r.id = %s;
                """,
                (request_id,)
            )
            return cur.fetchone()

def update_request_action(request_id, actor_role, action, remarks="", hod_id=None):
    role_lower = (actor_role or "").lower()
    action_lower = (action or "").lower()

    with get_connection() as conn:
        with conn.cursor() as cur:
            if role_lower == "supervisor":
                if action_lower == "accept":
                    new_status = "pending_hod"
                    new_stage = "hod"
                    if hod_id:
                        cur.execute(
                            """
                            UPDATE public.phd_requests
                            SET status = %s,
                                current_stage = %s,
                                supervisor_remarks = %s,
                                supervisor_acted_at = now(),
                                hod_id = %s,
                                updated_at = now()
                            WHERE id = %s
                            RETURNING *;
                            """,
                            (new_status, new_stage, remarks, hod_id, request_id)
                        )
                    else:
                        cur.execute(
                            """
                            UPDATE public.phd_requests
                            SET status = %s,
                                current_stage = %s,
                                supervisor_remarks = %s,
                                supervisor_acted_at = now(),
                                updated_at = now()
                            WHERE id = %s
                            RETURNING *;
                            """,
                            (new_status, new_stage, remarks, request_id)
                        )
                else:
                    new_status = "supervisor_declined"
                    new_stage = "completed"
                    cur.execute(
                        """
                        UPDATE public.phd_requests
                        SET status = %s,
                            current_stage = %s,
                            supervisor_remarks = %s,
                            supervisor_acted_at = now(),
                            updated_at = now()
                        WHERE id = %s
                        RETURNING *;
                        """,
                        (new_status, new_stage, remarks, request_id)
                    )

            elif role_lower == "hod":
                if action_lower == "accept":
                    new_status = "pending_principal"
                    new_stage = "principal"
                else:
                    new_status = "hod_declined"
                    new_stage = "completed"

                cur.execute(
                    """
                    UPDATE public.phd_requests
                    SET status = %s,
                        current_stage = %s,
                        hod_remarks = %s,
                        hod_acted_at = now(),
                        updated_at = now()
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (new_status, new_stage, remarks, request_id)
                )

            elif role_lower == "principal":
                if action_lower == "accept":
                    new_status = "approved"
                    new_stage = "completed"
                else:
                    new_status = "rejected"
                    new_stage = "completed"

                cur.execute(
                    """
                    UPDATE public.phd_requests
                    SET status = %s,
                        current_stage = %s,
                        principal_remarks = %s,
                        principal_acted_at = now(),
                        updated_at = now()
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (new_status, new_stage, remarks, request_id)
                )
            else:
                raise ValueError(f"Invalid actor role: {actor_role}")

            return cur.fetchone()
