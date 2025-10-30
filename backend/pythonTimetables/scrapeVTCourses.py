import requests
from bs4 import BeautifulSoup

def getAllCSVTCourses():
    """
    Scrape the VT CS catalog and return a list of courses.
    Each item: {
        "code": "CS2114",
        "title": "Software Design and Data Structures",
        "credits": 3 or (low, high)
    }
    """
    url = "https://catalog.vt.edu/undergraduate/course-descriptions/cs/"
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        raise ConnectionError(f"Failed to fetch catalog page, status code {resp.status_code}")

    soup = BeautifulSoup(resp.text, "html.parser")
    courses = []

    for block in soup.find_all("div", class_="courseblock"):
        code_span = block.find("span", class_="detail-code")
        title_span = block.find("span", class_="detail-title")
        credit_span = block.find("span", class_="detail-hours_html")
        if not code_span or not title_span or not credit_span:
            continue

        code = code_span.get_text(strip=True).replace(" ", "")
        title = title_span.get_text(strip=True)

        credit_text = credit_span.get_text(strip=True)
        credits = None
        # Expect formats like "(3 credits)" or "(1-19 credits)"
        if "(" in credit_text and "credits" in credit_text.lower():
            first_token = credit_text.strip().lstrip("(").rstrip(")").split()[0]
            if "-" in first_token:
                low, high = [int(x) for x in first_token.split("-")]
                credits = (low, high)
            else:
                try:
                    credits = int(first_token)
                except ValueError:
                    credits = None

        courses.append({
            "code": code,
            "title": title,
            "credits": credits
        })

    return courses
