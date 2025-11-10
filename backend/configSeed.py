# generate_courses_from_search.py
import json
import re
from typing import List, Dict, Any, Optional, Tuple, Union


from pythonTimetables.scrapeVTCourses import getAllCSVTCourses
from pythonTimetables.timeTablesVTT import searchIDData


# Common ASCII and Unicode dash-like characters:
# - U+002D HYPHEN-MINUS (-)
# - U+2010 HYPHEN (‐)
# - U+2012 FIGURE DASH (‒)
# - U+2013 EN DASH (–)
# - U+2014 EM DASH (—)
# - U+2212 MINUS SIGN (−)
DASH_CHARS = "-\u2010\u2012\u2013\u2014\u2212"


# Regex that removes leading whitespace, then any run of dash-like chars, then optional whitespace
LEADING_DASH_RE = re.compile(r"^\s*[" + re.escape(DASH_CHARS) + r"]+\s*")


def clean_leading_dash(s: str) -> str:
    """
    Remove any leading dash-like characters (ASCII and common Unicode dashes)
    and surrounding whitespace from the start of a string.
    Keeps interior dashes intact.
    """
    if not isinstance(s, str):
        return s  # pass through non-strings unchanged
    return LEADING_DASH_RE.sub("", s)


def to_credits_list(credits: Optional[Union[int, float, Tuple[int, int], str]]) -> Optional[List[int]]:
    """
    Normalize various credit representations to the target schema:
    - 3 -> [3]
    - (1, 19) -> [1, 19]
    - "1" or "1.0" -> [1]
    - "1-3" or "1 to 3" -> [1, 3]
    - "1 credit" -> [1]
    - None or unrecognized -> None
    """
    if credits is None:
        return None
    if isinstance(credits, str):
        s = credits.strip()
        # Range patterns like "1-3" or "1 to 3"
        m = re.match(r'^(\d+)\s*(?:-|to)\s*(\d+)$', s, flags=re.I)
        if m:
            return [int(m.group(1)), int(m.group(2))]
        # Single numeric possibly with unit like "1", "1.0", "1 credit"
        m = re.match(r'^(\d+)(?:\.0+)?\s*(?:cr|credit|credits)?$', s, flags=re.I)
        if m:
            return [int(m.group(1))]
        return None
    if isinstance(credits, tuple):
        low, high = credits
        return [int(low), int(high)]
    if isinstance(credits, (int, float)):
        return [int(credits)]
    return None


def course_from_search(
    search_dict: Dict[str, Any],
    fallback_title: str,
    catalog_credits: Optional[Union[int, float, Tuple[int, int], str]]
) -> Dict[str, Any]:
    """
    Convert the searchIDData aggregated dict + catalog fallbacks into the target schema.
    Credits source-of-truth: search_dict['creditHours'] if present/valid; fallback to catalog_credits.
    Category: use search_dict['subject'] if available, otherwise extract from code.
    Includes 'pathways' passthrough from searchIDData output.
    Prerequisites: stored exactly as returned from searchIDData (nested list format).
    """
    code = search_dict.get("code") or search_dict.get("courseId") or ""
    name_raw = search_dict.get("name") or fallback_title or ""
    name = clean_leading_dash(name_raw)


    # Credits: use SearchIDData first, then catalog fallback
    search_credits_list = to_credits_list(search_dict.get("creditHours"))
    catalog_credits_list = to_credits_list(catalog_credits)
    credits_list = search_credits_list if search_credits_list is not None else catalog_credits_list


    # Store prerequisites exactly as returned from searchIDData
    # Expected format: [['CS2114', 'ECE3514'], ['CS2505', 'ECE2564'], ...]
    prereqs_field = search_dict.get("prerequisites")
    if isinstance(prereqs_field, list):
        prereq_list = prereqs_field  # Already in correct nested list format
    else:
        prereq_list = []  # No prerequisites or invalid format


    description = search_dict.get("catalogDescription") or ""


    # Extract category from subject field, or fallback to parsing from code
    category = search_dict.get("subject")
    if not category and code:
        # Fallback: extract subject prefix from code (e.g., "CS3414" -> "CS")
        m = re.match(r'^([A-Z]{2,4})', code.upper())
        if m:
            category = m.group(1)
        else:
            category = "CS"  # ultimate fallback
    elif not category:
        category = "CS"  # default if nothing else available


    # Pathways list from searchIDData (default to [])
    pathways = search_dict.get("pathways") or []
    if isinstance(pathways, str):
        pathways = [p.strip() for p in pathways.split(',') if p.strip()]


    return {
        "code": code,
        "name": name,
        "credits": credits_list,             # [x] or [x, y] or None
        "prerequisites": prereq_list,        # Nested list: [['CS2114'], ['MATH2534', 'MATH3034']]
        "corequisites": [],
        "category": category,
        "semesters": ["Fall", "Spring"],
        "description": description,
        "pathways": pathways,
    }


def main() -> None:
    print(f"Starting course generation for next semester (auto-detected)...")
    catalog_courses = getAllCSVTCourses()
    print(f"Discovered {len(catalog_courses)} CS catalog courses to process.")
    MATH_courses = [{"code": "MATH1225", "title": "Calculus of a Single Variable", "credits": 3}, 
                    {"code": "MATH1226", "title": "Calculus of a Single Variable II", "credits": 3},
                    {"code": "MATH2214", "title": "Introduction to Differential Equations", "credits": 3},
                    {"code": "MATH2534", "title": "Introduction to Linear Algebra", "credits": 3},
                    {"code": "STAT3704", "title": "Descriptive statistics, probability, and inference.", "credits": 3},
                    {"code": "MATH2204", "title": "multi", "credits": None}]
    print("Adding MATH & STATS Courses")
    for c in MATH_courses:
        catalog_courses.append(c)
        print(f'Added: {c["code"]}')


    total = len(catalog_courses)
    results: List[Dict[str, Any]] = []
    processed = 0
    skipped = 0
    written = 0


    for idx, item in enumerate(catalog_courses, start=1):
        try:
            course_code = item.get("code")
            course_title = item.get("title", "")
            catalog_credits = item.get("credits", None)


            if not course_code:
                skipped += 1
                print(f"[{idx}/{total}] Skipping entry without code.")
                continue


            print(f"[{idx}/{total}] Processing {course_code} ...")


            # Query timetable/Banner via searchIDData (auto-detects semester)
            data = searchIDData(course_code, fetch_banner=True)


            # If no sections found and no metadata, still write a record with fallbacks
            if not data or not isinstance(data, dict):
                skipped += 1
                print(f"  -> No data returned for {course_code}. Skipping.")
                continue


            # Build final normalized record
            record = course_from_search(
                data,
                fallback_title=course_title,
                catalog_credits=catalog_credits
            )
            results.append(record)
            written += 1
            processed += 1


            # Quick summary line
            name_preview = (record['name'] or '')[:60]
            cr = record['credits']
            cr_str = f"{cr}" if cr is not None else "None"
            cat = record['category']
            pws = record.get('pathways') or []
            prereqs = record.get('prerequisites') or []
            print(f"  -> OK: {course_code} | category: {cat} | title: '{name_preview}' | credits: {cr_str} | pathways: {pws} | prereqs: {prereqs}")


        except Exception as e:
            skipped += 1
            print(f"  -> Error on {item.get('code','UNKNOWN')}: {e}. Skipping.")


    print(f"Processed {processed} courses, skipped {skipped}.")
    out_file = "courses.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Wrote {written} course records to {out_file}.")
    print("Done.")


if __name__ == "__main__":
    main()
