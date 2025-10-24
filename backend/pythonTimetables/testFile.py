from scrapeVTCourses import getAllCSVTCourses
from timeTablesVTT import get_crn, Semester


# Example use of timeTables
course = get_crn(year='2026', semester=Semester.SPRING, crn='13416')
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

# Example use of scrapeALL (CS VT Courses)

cs_courses = getAllCSVTCourses()
for course, credit in list(cs_courses.items())[:10]: #only print 10 of them (delete [:10] if you want to see all)
    print(f"{course}: {credit}")
print(f"\nTotal CS courses found: {len(cs_courses)}")

#Returns a dictionary, so you can just look up a course for its credits if needed: cs_courses["3114"]