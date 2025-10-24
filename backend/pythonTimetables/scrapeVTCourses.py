import requests
from bs4 import BeautifulSoup

def getAllCSVTCourses():
    """
    Scrapes the Virginia Tech CS course catalog and returns a dictionary
    mapping course numbers (e.g., 'CS4894') to credit hours (e.g., 3).
    Variable-credit courses (like '1-19 credits') are stored as tuples.
    """
    url = "https://catalog.vt.edu/undergraduate/course-descriptions/cs/"
    response = requests.get(url)

    course_dict = {}

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")

        for block in soup.find_all("div", class_="courseblock"):
            number_span = block.find("span", class_="detail-code")
            credit_span = block.find("span", class_="detail-hours_html")

            if number_span and credit_span:
                course_number = number_span.get_text(strip=True).replace(" ", "")
                credit_text = credit_span.get_text(strip=True)

                # Match forms like (3 credits) or (1-19 credits)
                if "(" in credit_text and "credits" in credit_text.lower():
                    credit_value = credit_text.strip("()").split()[0]
                    if "-" in credit_value:
                        low, high = [int(x) for x in credit_value.split("-")]
                        course_dict[course_number] = (low, high)
                    else:
                        course_dict[course_number] = int(credit_value)
    else:
        raise ConnectionError(f"Failed to fetch catalog page, status code {response.status_code}")

    return course_dict
