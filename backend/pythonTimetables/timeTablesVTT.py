from collections import defaultdict
from enum import Enum
import re
from typing import Dict, List, Set, Tuple

from pandas import read_html
import pandas.core.series
import requests

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


def get_crn(year: str, semester: Semester, crn: str) -> Course:
    crn_search = search_timetable(year, semester, crn=crn)
    return crn_search[0] if crn_search else None


def get_semesters() -> Set[Tuple[str, str]]:
    semester_dct = {'Spring': Semester.SPRING, 'Summer': Semester.SUMMER,
                    'Fall': Semester.FALL, 'Winter': Semester.WINTER}
    return set((semester_dct[m.group(1)], m.group(2)) for m in re.finditer(
        r'<OPTION VALUE="\\d{6}">([A-Z][a-z]+) (\\d+)</OPTION>',
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
