import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_helper import set_cell_background, set_cell_margins, set_cell_borders

# Color Palette
NAVY_HEX = "154B90"      # BPJS Blue primary
DARK_SLATE_HEX = "0F172A"
MUTED_SLATE_HEX = "475569"
TEAL_HEX = "0D9488"
EMERALD_HEX = "059669"
AMBER_HEX = "D97706"
CRIMSON_HEX = "DC2626"
LIGHT_BLUE_HEX = "F0F6FC"
LIGHT_AMBER_HEX = "FEF3C7"
LIGHT_GREEN_HEX = "ECFDF5"
LIGHT_GRAY_HEX = "F8FAFC"
BORDER_GRAY_HEX = "E2E8F0"

COLOR_NAVY = RGBColor(21, 75, 144)
COLOR_DARK = RGBColor(15, 23, 42)
COLOR_MUTED = RGBColor(71, 85, 105)
COLOR_CRIMSON = RGBColor(220, 38, 38)
COLOR_EMERALD = RGBColor(5, 150, 105)
COLOR_AMBER = RGBColor(217, 119, 6)

def format_doc_defaults(doc):
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = COLOR_DARK
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

def add_header_banner(doc, title, subtitle, category_tag="HEALTHKATHON 2026 BPJS KESEHATAN"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.5)
    
    cell = table.cell(0, 0)
    set_cell_background(cell, NAVY_HEX)
    set_cell_margins(cell, top=260, bottom=260, left=280, right=280)
    set_cell_borders(cell)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    
    run_tag = p.add_run(f"★  {category_tag.upper()}  ★\n")
    run_tag.font.name = "Arial"
    run_tag.font.size = Pt(9.5)
    run_tag.font.bold = True
    run_tag.font.color.rgb = RGBColor(254, 215, 170)
    
    run_title = p.add_run(f"{title}\n")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(17)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(255, 255, 255)
    
    run_sub = p.add_run(subtitle)
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(224, 231, 255)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(6)
    p_after.paragraph_format.space_after = Pt(6)

def add_slide_section_header(doc, slide_num, slide_title, subtitle=""):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    
    run_badge = p.add_run(f"SLIDE {slide_num}: ")
    run_badge.font.name = "Arial"
    run_badge.font.size = Pt(13)
    run_badge.font.bold = True
    run_badge.font.color.rgb = COLOR_CRIMSON
    
    run_title = p.add_run(slide_title)
    run_title.font.name = "Arial"
    run_title.font.size = Pt(13)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_NAVY
    
    if subtitle:
        p_sub = doc.add_paragraph()
        p_sub.paragraph_format.space_before = Pt(0)
        p_sub.paragraph_format.space_after = Pt(6)
        p_sub.paragraph_format.keep_with_next = True
        run_sub = p_sub.add_run(subtitle)
        run_sub.font.name = "Calibri"
        run_sub.font.size = Pt(10)
        run_sub.font.italic = True
        run_sub.font.color.rgb = COLOR_MUTED

def add_box(doc, content_dict, border_hex="154B90", bg_hex="F0F6FC"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.5)
    
    cell = table.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    set_cell_borders(cell, left={'val': 'single', 'sz': 24, 'color': border_hex})
    
    first = True
    for p_info in content_dict:
        if first:
            p = cell.paragraphs[0]
            first = False
        else:
            p = cell.add_paragraph()
            
        p.paragraph_format.space_before = Pt(p_info.get('space_before', 1))
        p.paragraph_format.space_after = Pt(p_info.get('space_after', 3))
        p.paragraph_format.line_spacing = p_info.get('line_spacing', 1.15)
        
        runs = p_info.get('runs', [])
        for r_text, r_bold, r_italic, r_size, r_color in runs:
            r = p.add_run(r_text)
            r.font.name = 'Calibri'
            r.font.bold = r_bold
            r.font.italic = r_italic
            r.font.size = Pt(r_size)
            if r_color:
                r.font.color.rgb = r_color
                
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(2)
    p_space.paragraph_format.space_after = Pt(2)

print("Base layout definitions loaded.")
