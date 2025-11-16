import sys, json, tempfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors

def generate_pdf(data):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    doc = SimpleDocTemplate(tmp.name, pagesize=letter)

    story = []
    styles = getSampleStyleSheet()

    for semester, courses in data.items():
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"<b>{semester}</b>", styles["Heading2"]))
        story.append(Spacer(1, 4))

        if not courses:
            story.append(Paragraph("No courses listed.", styles["Normal"]))
            continue

        table_data = [["Course Code", "Course Name", "Credits"]]

        for c in courses:
            table_data.append([
                c.get("code", ""),
                c.get("name", ""),
                ", ".join(map(str, c.get("credits", [])))
            ])

        table = Table(table_data, colWidths=[100, 300, 60])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#D9D9D9")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.black),
            ("ALIGN", (0,0), (-1,-1), "LEFT"),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0,0), (-1,0), 8),
            ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.whitesmoke, colors.lightgrey])
        ]))

        story.append(table)
        story.append(Spacer(1, 18))

    doc.build(story)
    return tmp.name

if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw)

    # 🔥 FIX: use the nested semesters object
    data = payload["plan"]["semesters"]

    # Generate the PDF
    pdf_path = generate_pdf(data)

    # Output PDF
    with open(pdf_path, "rb") as f:
        sys.stdout.buffer.write(f.read())
