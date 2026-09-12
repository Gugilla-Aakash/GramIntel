from ..models import User, Case

def can_access_case(user: User, case: Case) -> bool:
    if user.role == "officer":
        return True
    if case.applicant_id == user.id:
        return True
    if case.forwarded_by_id is not None and case.forwarded_by_id == user.id:
        return True
    return False
