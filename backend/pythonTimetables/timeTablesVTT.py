from collections import defaultdict
from enum import Enum
import re
from typing import Dict, List, Set, Tuple

from pandas import read_html
import pandas.core.series
import requests

import functools
import time

'''


I'll Document all this later dont worry -Armen


'''

__docformat__ = "google"


class Campus(Enum):
    BLACKSBURG = '0'
    VIRTUAL = '10'


class Day(Enum):
    MONDAY = 'Monday'
    TUESDAY = 'Tuesday'
    WEDNESDAY = 'Wednesday'
    THURSDAY = 'Thursday'
    FRIDAY = 'Friday'
    SATURDAY = 'Saturday'
    SUNDAY = 'Sunday'
    ARRANGED = 'Arranged'


class Modality(Enum):
    ALL = '%'
    IN_PERSON = 'A'
    HYBRID = 'H'
    ONLINE_SYNC = 'N'
    ONLINE_ASYNC = 'O'


class Pathway(Enum):
    ALL = 'AR%'
    CLE_1 = 'AR01'
    CLE_2 = 'AR02'
    CLE_3 = 'AR03'
    CLE_4 = 'AR04'
    CLE_5 = 'AR05'
    CLE_6 = 'AR06'
    CLE_7 = 'AR07'
    PATH_1A = 'G01A'
    PATH_1F = 'G01F'
    PATH_2 = 'G02'
    PATH_3 = 'G03'
    PATH_4 = 'G02'
    PATH_5A = 'G02'
    PATH_5F = 'G02'
    PATH_6A = 'G06A'
    PATH_6D = 'G06D'
    PATH_7 = 'G07'


class SectionType(Enum):
    ALL = '%'
    INDEPENDENT_STUDY = '%I%'
    LAB = '%B%'
    LECTURE = '%L%'
    RECITATION = '%C%'
    RESEARCH = '%R%'
    ONLINE = 'ONLINE'


class Semester(Enum):
    SPRING = '01'
    SUMMER = '06'
    FALL = '09'
    WINTER = '12'


class Status(Enum):
    ALL = ''
    OPEN = 'on'


class Course:
    _section_type_dct = {
        'I': SectionType.INDEPENDENT_STUDY,
        'B': SectionType.LAB,
        'L': SectionType.LECTURE,
        'C': SectionType.RECITATION,
        'R': SectionType.RESEARCH,
        'O': SectionType.ONLINE,
    }
    _modality_dct = {
        'Face-to-Face Instruction': Modality.IN_PERSON,
        'Hybrid (F2F & Online Instruc.)': Modality.HYBRID,
        'Online with Synchronous Mtgs.': Modality.ONLINE_SYNC,
        'Online: Asynchronous': Modality.ONLINE_ASYNC,
    }
    _day_dct = {
        'M': Day.MONDAY, 'T': Day.TUESDAY, 'W': Day.WEDNESDAY,
        'R': Day.THURSDAY, 'F': Day.FRIDAY, 'S': Day.SATURDAY,
        'U': Day.SUNDAY, '(ARR)': Day.ARRANGED,
    }

    def __init__(self, year: str, semester: Semester,
                 timetable_data: pandas.core.series.Series,
                 extra_class_data: pandas.core.series.Series) -> None:
        subject, code = re.match(r'(.+)-(.+)', timetable_data[1]).group(1, 2)

        if semester == Semester.SUMMER:
            name = re.search(r'- \d{2}-[A-Z]{3}-\d{4}(.+)$', timetable_data[2]).group(1)
        else:
            name = timetable_data[2]

        section_type = self._section_type_dct[
            'O' if re.match(r'ONLINE COURSE', timetable_data[3]) else
            re.match(r'[LBICR]', timetable_data[3]).group(0)
        ]

        modality = (
            self._modality_dct[timetable_data[4]]
            if timetable_data[4] in self._modality_dct else None
        )

        class_dct = defaultdict(set)
        for day in [self._day_dct[d] for d in timetable_data[8].split()]:
            if day == Day.ARRANGED:
                continue
            class_dct[day].add((timetable_data[9], timetable_data[10], timetable_data[11]))

        if (extra_class_data is not None and extra_class_data[4] == '* Additional Times *'):
            for day in [self._day_dct[d] for d in extra_class_data[8].split()]:
                class_dct[day].add(
                    (extra_class_data[9], extra_class_data[10], extra_class_data[11])
                )

        self._course_data = {
            'year': year,
            'semester': semester,
            'crn': timetable_data[0][:5],
            'subject': subject,
            'code': code,
            'name': name,
            'section_type': section_type,
            'modality': modality,
            'credit_hours': timetable_data[5],
            'capacity': timetable_data[6],
            'professor': timetable_data[7],
            'schedule': dict(class_dct),
        }

        # Cache Banner request result once
        self._banner_info = make_banner_request(
            self.get_crn(), self.get_year(), self.get_semester(),
            self.get_subject(), self.get_code()
        )

    def __str__(self):
        return ''.join(f'{d}: {self._course_data[d]}, ' for d in self._course_data)[:-2]

    def get_year(self) -> str:
        return self._course_data['year']

    def get_semester(self) -> Semester:
        return self._course_data['semester']

    def get_crn(self) -> str:
        return self._course_data['crn']

    def get_subject(self) -> str:
        return self._course_data['subject']

    def get_code(self) -> str:
        return self._course_data['code']

    def get_name(self) -> str:
        return self._course_data['name']

    def get_type(self) -> SectionType:
        return self._course_data['section_type']

    def get_modality(self) -> Modality:
        return self._course_data['modality']

    def get_credit_hours(self) -> str:
        return self._course_data['credit_hours']

    def get_capacity(self) -> str:
        return self._course_data['capacity']

    def get_professor(self) -> str:
        return self._course_data['professor']

    def get_schedule(self) -> Dict[Day, Set[Tuple[str, str, str]]]:
        return self._course_data['schedule']

    def has_open_spots(self) -> bool:
        return True if search_timetable(self.get_year(), self.get_semester(),
                                        crn=self.get_crn(),
                                        status=Status.OPEN) else False

    def get_prerequisites(self) -> str:
        return self._banner_info["prerequisites"]

    def get_catalog_description(self) -> str:
        return self._banner_info["catalog_description"]

    def get_comments(self) -> str:
        return self._banner_info["comments"]


class InvalidRequestException(Exception):
    pass


class InvalidSearchException(Exception):
    pass


def parse_semester(sem_str: str) -> Semester:
    """
    Convert a human string like 'Spring', 'summer', 'FALL', 'Winter' to Semester enum.
    Accepts common abbreviations: 'Sp', 'Su', 'Fa', 'Wi'.
    """
    if not isinstance(sem_str, str):
        raise TypeError("Semester must be a string like 'Spring' or 'Fall'.")
    s = sem_str.strip().lower()
    aliases = {
        'spring': Semester.SPRING, 'sp': Semester.SPRING,
        'summer': Semester.SUMMER, 'su': Semester.SUMMER,
        'fall':   Semester.FALL,   'fa': Semester.FALL, 'autumn': Semester.FALL,
        'winter': Semester.WINTER, 'wi': Semester.WINTER,
    }
    try:
        return aliases[s]
    except KeyError:
        raise ValueError(f"Unknown semester: {sem_str!r}. Expected one of Spring/Summer/Fall/Winter.")


def make_banner_request(crn: str, year: str, semester: Semester,
                        subject: str, code: str) -> Dict[str, str]:
    """
    Fetch prerequisites, catalog description, and comments
    from Banner's course comments endpoint.
    """
    try:
        url = (
            f"https://selfservice.banner.vt.edu/ssb/HZSKVTSC.P_ProcComments?"
            f"CRN={crn}&TERM={semester.value}&YEAR={year}"
            f"&SUBJ={subject}&CRSE={code}&history=N"
        )
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        html = response.text

        def extract_field(label_pattern):
            match = re.search(
                rf'<td[^>]*>{label_pattern}</td>\s*<td[^>]*class="pldefault"[^>]*>(.*?)</td>',
                html,
                re.DOTALL | re.IGNORECASE
            )
            if match:
                text = re.sub(r'<.*?>', '', match.group(1))
                text = re.sub(r'\s+', ' ', text).strip()
                return text
            return None

        prerequisites = extract_field(r'Prerequisites:?')
        catalog_description = extract_field(r'Catalog Description:?')
        comments = extract_field(r'Comments:?')

        return {
            "prerequisites": prerequisites or "No prerequisites found.",
            "catalog_description": catalog_description or "No catalog description found.",
            "comments": comments or "No comments found."
        }

    except Exception as e:
        return {
            "prerequisites": f"Error retrieving data: {e}",
            "catalog_description": f"Error retrieving data: {e}",
            "comments": f"Error retrieving data: {e}"
        }


def search_crn(year: str, semester: str, crn: str) -> Course:
    crn_search = search_timetable(year, parse_semester(semester), crn=crn)
    return crn_search[0] if crn_search else None


def get_semesters() -> Set[Tuple[str, str]]:
    semester_dct = {'Spring': Semester.SPRING, 'Summer': Semester.SUMMER,
                    'Fall': Semester.FALL, 'Winter': Semester.WINTER}
    return set((semester_dct[m.group(1)], m.group(2)) for m in re.finditer(
        r'<OPTION VALUE="\d{6}">([A-Z][a-z]+) (\d+)</OPTION>',
        _make_request(request_type='GET')))


def get_subjects() -> Set[Tuple[str, str]]:
    return set((m.group(1), m.group(2)) for m in
               re.finditer(r'\("([A-Z]+) - (.+?)"',
                           _make_request(request_type='GET')))


def search_timetable(year: str, semester: Semester,
                     campus: Campus = Campus.BLACKSBURG,
                     pathway: Pathway = Pathway.ALL, subject: str = '',
                     section_type: SectionType = SectionType.ALL,
                     code: str = '', crn: str = '',
                     status: Status = Status.ALL,
                     modality: Modality = Modality.ALL) -> List[Course]:
    term_year = ((str(int(year) - 1) if semester == Semester.WINTER else year)
                 + semester.value)
    subject = '%' if subject == '' else subject
    request = _make_request(request_type='POST',
                            request_data={'CAMPUS': campus,
                                          'TERMYEAR': term_year,
                                          'CORE_CODE': pathway,
                                          'subj_code': subject,
                                          'SCHDTYPE': section_type,
                                          'CRSE_NUMBER': code,
                                          'crn': crn,
                                          'open_only': status,
                                          'sess_code': modality})
    if request == '':
        return []

    request_data = read_html(request)[4]
    course_list = []
    for i in range(1, request_data.shape[0]):
        if isinstance(request_data.iloc[i][0], str):
            course_list.append(Course(year, semester, request_data.iloc[i],
                                      request_data.iloc[i + 1] if
                                      request_data.shape[0] > i + 1 else None))
    return course_list


def _make_request(request_type: str, request_data: Dict[str, str] = None) -> str:
    url = 'https://apps.es.vt.edu/ssb/HZSKVTSC.P_ProcRequest'

    if request_type == 'POST':
        for r in request_data:
            request_data[r] = (request_data[r].value if
                               issubclass(type(request_data[r]), Enum)
                               else request_data[r])
        request = requests.post(url, request_data)

        if 'THERE IS AN ERROR WITH YOUR REQUEST' in request.text:
            raise InvalidRequestException('Invalid search parameters provided.')
        if 'There was a problem with your request' in request.text:
            if 'NO SECTIONS FOUND FOR THIS INQUIRY' in request.text:
                return ''
            else:
                msg = re.search(r'<b class=red_msg><li>(.+)</b>', request.text).group(1)
                raise InvalidSearchException(msg)
        return request.text

    elif request_type == 'GET':
        response = requests.get(url)
        return response.text

    else:
        raise ValueError('Invalid request type')


def get_crns_for_course_id(year: str, semester: str, course_id: str) -> List[str]:
    """
    Given a course_id like 'CS2114', return all CRNs for that course in the given term.
    """
    m = re.fullmatch(r'([A-Za-z]+)\s*[-:]?\s*(\d{4})', course_id.strip())
    if not m:
        raise ValueError(f"Invalid course_id format: {course_id!r}. Expected like 'CS2114' or 'CS-2114'.")
    subject = m.group(1).upper()
    code = m.group(2)

    courses = search_timetable(
        year=year,
        semester=parse_semester(semester),
        subject=subject,
        code=code,
        campus=Campus.BLACKSBURG,      # adjust if you want to include Virtual campus
        status=Status.ALL,             # or Status.OPEN to only get open sections
        modality=Modality.ALL,         # filter if needed
        section_type=SectionType.ALL,  # filter if needed
    )
    return [c.get_crn() for c in courses]

# Reuse one session for connection pooling (TLS + TCP reuse)
_session = requests.Session()  # safe for single-process, single-thread typical use

# Optional: short-lived cache to avoid repeated identical term queries during a run
def _lru_ttl_cache(ttl_seconds=120, maxsize=256):
    def decorator(func):
        @functools.lru_cache(maxsize=maxsize)
        def cached(args_key):
            value = func(*args_key)
            return (value, time.time() + ttl_seconds)
        def wrapper(*args):
            key = tuple(args)
            value, expires = cached(key)
            if time.time() > expires:
                # refresh
                cached.cache_clear()
                value, expires = cached(key)
            return value
        wrapper.cache_clear = cached.cache_clear
        return wrapper
    return decorator


# Narrow helper to call timetable with connection reuse
def _make_request_with_session(request_type: str, request_data: Dict[str, str] = None) -> str:
    url = 'https://apps.es.vt.edu/ssb/HZSKVTSC.P_ProcRequest'
    if request_type == 'POST':
        # Coerce Enum values early (mirrors original)
        for r in list(request_data.keys()):
            v = request_data[r]
            request_data[r] = (v.value if hasattr(v, "value") else v)
        resp = _session.post(url, data=request_data, timeout=15)  # reuse socket
        text = resp.text
        if 'THERE IS AN ERROR WITH YOUR REQUEST' in text:
            raise InvalidRequestException('Invalid search parameters provided.')
        if 'There was a problem with your request' in text:
            if 'NO SECTIONS FOUND FOR THIS INQUIRY' in text:
                return ''
            else:
                m = re.search(r'<b class=red_msg><li>(.+)</b>', text)
                raise InvalidSearchException(m.group(1) if m else 'Unknown error')
        return text
    elif request_type == 'GET':
        return _session.get(url, timeout=15).text
    else:
        raise ValueError('Invalid request type')


# Lightweight Banner comments fetch with session reuse and cache
@functools.lru_cache(maxsize=512)  # cache by (crn, year, sem, subj, code)
def _banner_comments_cached(crn: str, year: str, semester_value: str, subject: str, code: str) -> Dict[str, str]:
    url = (
        f"https://selfservice.banner.vt.edu/ssb/HZSKVTSC.P_ProcComments?"
        f"CRN={crn}&TERM={semester_value}&YEAR={year}&SUBJ={subject}&CRSE={code}&history=N"
    )
    try:
        r = _session.get(url, timeout=10)  # pooled
        r.raise_for_status()
        html = r.text

        def extract_field(label_pattern):
            m = re.search(
                rf'<td[^>]*>{label_pattern}</td>\s*<td[^>]*class="pldefault"[^>]*>(.*?)</td>',
                html,
                re.DOTALL | re.IGNORECASE
            )
            if not m:
                return None
            text = re.sub(r'<.*?>', '', m.group(1))
            text = re.sub(r'\s+', ' ', text).strip()
            return text

        prerequisites = extract_field(r'Prerequisites:?')
        catalog_description = extract_field(r'Catalog Description:?')
        comments = extract_field(r'Comments:?')

        return {
            "prerequisites": prerequisites or "No prerequisites found.",
            "catalogDescription": catalog_description or "No catalog description found.",
            "comments": comments or "No comments found."
        }
    except Exception as e:
        err = f"Error retrieving data: {e}"
        return {"prerequisites": err, "catalogDescription": err, "comments": err}


def _get_pathways_for_course(year: str, semester: Semester, subject: str, code: str) -> List[str]:
    """
    Fetch pathway information for a course by parsing the timetable HTML.
    Returns a list of pathway codes (e.g., ['AR01', 'G02', 'G06A']).
    """
    term_year = ((str(int(year) - 1) if semester == Semester.WINTER else year)
                 + semester.value)

    try:
        # Make request to get the raw HTML for this subject+code
        request_data = {
            'CAMPUS': Campus.BLACKSBURG.value,
            'TERMYEAR': term_year,
            'CORE_CODE': Pathway.ALL.value,
            'subj_code': subject,
            'SCHDTYPE': SectionType.ALL.value,
            'CRSE_NUMBER': code,
            'crn': '',
            'open_only': Status.ALL.value,
            'sess_code': Modality.ALL.value
        }
        html = _make_request(request_type='POST', request_data=request_data)
        if not html:
            return []

        # Pathway code patterns: AR01..AR07 (CLE) and G01A/G01F/G02/G06D... (GenEd)
        pathway_pattern = r'\b(AR\d{2}|G\d{2}[A-Z]?)\b'
        found = re.findall(pathway_pattern, html)

        # Deduplicate while preserving order
        seen = set()
        out = []
        for p in found:
            if p not in seen:
                seen.add(p)
                out.append(p)
        return out

    except Exception:
        return []


# Optimized searchID with pathways
def searchID(year: str, semester_str: str, course_id: str, fetch_banner: bool = True) -> dict:
    """
    Optimized:
      - Reuses a persistent requests.Session.
      - Avoids repeated parsing work via minimal changes.
      - Caches Banner comments per course/CRN.
      - Optional fetch_banner to skip Banner call when not needed.

    Returns:
      dict with keys:
        year, semester, courseId, subject, code, name, creditHours,
        prerequisites, catalogDescription, comments, pathways, sections[]
    """
    sem = parse_semester(semester_str)
    m = re.fullmatch(r'([A-Za-z]+)\s*[-:]?\s*(\d{4})', course_id.strip())
    if not m:
        raise ValueError(f"Invalid course_id: {course_id!r}. Expected like 'CS3414' or 'CS-3414'.")
    subject, code = m.group(1).upper(), m.group(2)

    # Ensure timetable requests use the pooled session-backed request helper
    global _make_request
    _make_request = _make_request_with_session

    sections = search_timetable(
        year=year,
        semester=sem,
        subject=subject,
        code=code,
        campus=Campus.BLACKSBURG,
        status=Status.ALL,
        modality=Modality.ALL,
        section_type=SectionType.ALL,
    )

    if not sections:
        return {
            "year": year,
            "semester": semester_str,
            "courseId": course_id,
            "subject": subject,
            "code": f"{subject}{code}",
            "name": None,
            "creditHours": None,
            "prerequisites": None if fetch_banner else None,
            "catalogDescription": None if fetch_banner else None,
            "comments": None if fetch_banner else None,
            "pathways": [],
            "sections": [],
        }

    first = sections[0]

    # Conditionally fetch Banner metadata once (cached)
    if fetch_banner:
        bc = _banner_comments_cached(
            first.get_crn(),
            first.get_year(),
            first.get_semester().value,
            first.get_subject(),
            first.get_code()
        )
        prereqs = bc["prerequisites"]
        catalog_desc = bc["catalogDescription"]
        comments = bc["comments"]
    else:
        prereqs = None
        catalog_desc = None
        comments = None

    # Pathways for this course (across its listings)
    pathways = _get_pathways_for_course(year, sem, subject, code)

    section_entries: List[Dict] = []
    for c in sections:
        sched_list = []
        for day, meetings in c.get_schedule().items():
            for start, end, location in meetings:
                sched_list.append({
                    "day": day.value,
                    "start": start,
                    "end": end,
                    "location": location,
                })
        section_entries.append({
            "crn": c.get_crn(),
            "type": c.get_type().name,
            "modality": (c.get_modality().name if c.get_modality() else None),
            "capacity": c.get_capacity(),
            "instructor": c.get_professor(),
            "schedule": sched_list,
        })

    return {
        "year": year,
        "semester": semester_str,
        "courseId": course_id,
        "subject": subject,
        "code": f"{first.get_subject()}{first.get_code()}",
        "name": first.get_name(),
        "creditHours": first.get_credit_hours(),
        "prerequisites": prereqs,
        "catalogDescription": catalog_desc,
        "comments": comments,
        "pathways": pathways,
        "sections": section_entries,
    }
