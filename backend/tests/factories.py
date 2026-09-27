from itertools import count

_sequence = count(1)


def employee_payload(**overrides) -> dict:
    """A valid create payload; each call gets a unique email."""
    n = next(_sequence)
    payload = {
        "full_name": f"Test Person {n}",
        "email": f"person{n}@acme.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country_code": "US",
        "salary": 100_000,
        "hire_date": "2022-03-01",
    }
    return payload | overrides


def create_employee(client, **overrides) -> dict:
    response = client.post("/api/employees", json=employee_payload(**overrides))
    assert response.status_code == 201, response.text
    return response.json()
