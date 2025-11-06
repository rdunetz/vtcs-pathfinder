from scrapeVTCourses import getAllCSVTCourses
from timeTablesVTT import *


# Example use of timeTables
course = searchcrn(year='2026', semester="Spring", crn='13390')
if course:
    print(f"Course: {course.get_subject()}-{course.get_code()} {course.get_name()}")
    print(f"CRN: {course.get_crn()}")
    print(f"Instructor: {course.get_professor()}")
    print(f"Credits: {course.get_credit_hours()}")
    print(f"Capacity: {course.get_capacity()}")
    print(f"Campus: {course.get_modality().name}")
    print("Schedule:")
    for day, times in course.get_schedule().items():
        for start, end, location in times:
            print(f"  {day.value}: {start}-{end} at {location}")
    print(f"Prerequisites: {course.get_prerequisites()}")
    print(f"Catalog Description: {course.get_catalog_description()}")
    print(f"Comments: {course.get_comments()}")
else:
    print("No course found for the provided CRN.")
print("="*100)

course2 = searchCRNData(year='2026', semester="Spring", crn='13390')
print(course2)

print("="*100)

# Example use of scrapeALL (CS VT Courses)
#Returns a dictionary, so you can just look up a course for its credits if needed: cs_courses["3114"]



cs_courses = getAllCSVTCourses()
csCoursesList = []
for course in (cs_courses): #only print 10 of them (delete [:10] if you want to see all)
    print(course["code"])
    csCoursesList.append(course["code"])
print(f"\nTotal CS courses found: {len(cs_courses)}")



print("="*100)

crns = get_crns_for_course_id("2026", "Spring", "CS4944")
print(crns)

courses = search_timetable(
    year="2026",
    semester=parse_semester("Spring"),
    subject="CS",
    code="3414",
    campus=Campus.BLACKSBURG,      # adjust if you want to include Virtual campus
    status=Status.ALL,             # or Status.OPEN to only get open sections
    modality=Modality.ALL,         # filter if needed
    section_type=SectionType.ALL,  # filter if needed
)

print("="*100)

dict1 = searchID("2026", "Spring", "CS4944")
print(dict1)
if not dict1["sections"]:
    print("No sections found.")
else:
    # Print top-level once
    print(f"{dict1['code']} - {dict1['name']}")
    print(f"Credits: {dict1['creditHours']}")
    print(f"Prerequisites: {dict1['prerequisites']}")
    print(f"Description: {dict1['catalogDescription']}")
    print("Sections:")
    for sec in dict1["sections"]:
        print(f"  CRN: {sec['crn']}, Type: {sec['type']}, Modality: {sec['modality']}, Instructor: {sec['instructor']}, Capacity: {sec['capacity']}")
        for mtg in sec["schedule"]:
            print(f"    {mtg['day']}: {mtg['start']}–{mtg['end']} @ {mtg['location']}")