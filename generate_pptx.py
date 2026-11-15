import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_helix_deck(output_path="HELIX_Presentation.pptx"):
    prs = Presentation()
    # 16:9 Widescreen standard
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Theme colors
    BG_COLOR = RGBColor(7, 11, 20)         # #070B14
    PANEL_BG = RGBColor(16, 23, 38)        # #101726
    PANEL_BORDER = RGBColor(40, 56, 85)    # #283855
    ACCENT_BLUE = RGBColor(127, 178, 255)  # #7FB2FF
    ACCENT_CYAN = RGBColor(61, 224, 197)   # #3DE0C5
    ACCENT_AMBER = RGBColor(244, 184, 96)  # #F4B860
    TEXT_LIGHT = RGBColor(232, 238, 247)   # #E8EEF7
    TEXT_MUTED = RGBColor(138, 151, 173)   # #8A97AD
    CARD_BG = RGBColor(14, 21, 35)

    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, tag, title):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11), Inches(0.35))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = ACCENT_CYAN
        p_tag.font.name = "Arial"

        # Slide Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.75))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_LIGHT
        p_title.font.name = "Arial"

    def add_card(slide, left, top, width, height, title="", border_color=PANEL_BORDER, fill_color=PANEL_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = fill_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)

        if title:
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), Inches(0.4))
            p = tb.text_frame.paragraphs[0]
            p.text = title
            p.font.size = Pt(15)
            p.font.bold = True
            p.font.color.rgb = ACCENT_BLUE
            p.font.name = "Arial"
        return card

    # ==========================================
    # SLIDE 1: Title & The 44-Minute Blackout
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Sub-badge
    b1 = s1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(11), Inches(0.4))
    p = b1.text_frame.paragraphs[0]
    p.text = "HUMAN RESEARCH PROGRAM • DEEP SPACE EXPLORATION COCKPIT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    # Main Big Title
    t1 = s1.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11.5), Inches(1.6))
    p = t1.text_frame.paragraphs[0]
    p.text = "HELIX: The Body's Flight Computer"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    p2 = t1.text_frame.add_paragraph()
    p2.text = "Autonomous 3D Biometric Cockpit for the 44-Minute Mars Telemedicine Blackout"
    p2.font.size = Pt(20)
    p2.font.color.rgb = ACCENT_BLUE
    p2.space_before = Pt(8)

    # Three Core Metric Cards
    c1 = add_card(s1, Inches(0.8), Inches(3.6), Inches(3.6), Inches(2.8), "44-Minute Comms Blackout")
    tb = s1.shapes.add_textbox(Inches(1.0), Inches(4.3), Inches(3.2), Inches(1.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Speed-of-light delay makes real-time medical consultation impossible on Earth–Mars transit."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_MUTED

    c2 = add_card(s1, Inches(4.8), Inches(3.6), Inches(3.6), Inches(2.8), "Silent Physiological Decay")
    tb = s1.shapes.add_textbox(Inches(5.0), Inches(4.3), Inches(3.2), Inches(1.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Bone demineralization (-1.5%/mo), cephalad fluid shifts, and SANS optic edema progress asymptomatically."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_MUTED

    c3 = add_card(s1, Inches(8.8), Inches(3.6), Inches(3.7), Inches(2.8), "Autonomous Resolution", ACCENT_CYAN)
    tb = s1.shapes.add_textbox(Inches(9.0), Inches(4.3), Inches(3.3), Inches(1.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "3D Ghost Twin + Predictive Health Runway™ + One Thing Today executive action engine."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_LIGHT

    # Speaker Notes
    s1.notes_slide.notes_text_frame.text = (
        "Minute 1 Hook: Establish the gravity of the 44-minute comms blackout. "
        "At 200 million km, an acute medical anomaly cannot wait for Mission Control in Houston. "
        "Astronauts are clinically autonomous by physical necessity."
    )

    # ==========================================
    # SLIDE 2: Silent Decay vs Alarm Fatigue
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "The Human Factors Dilemma", "Why Traditional Medical Telemetry Fails in Deep Space")

    # Left: The Biology
    add_card(s2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9), "Human Biology in Microgravity")
    tb = s2.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.0), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_bio = [
        ("Bone Density Collapse: ", "-1.5% loss per month in weight-bearing bones (pelvis & lumbar spine)."),
        ("Fluid Cephalad Shift: ", "1.5–2L fluid shifts headward, elevating intracranial pressure."),
        ("SANS (Vision Impairment): ", "Optic disc edema and choroidal folds threaten irreversible vision loss."),
        ("Cognitive Exhaustion: ", "Isolation, confinement, and circadian disruption degrade executive decision quality.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_bio):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = ACCENT_AMBER
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(10)

    # Right: The Failure of Legacy Dashboards
    add_card(s2, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9), "The Failure of Legacy Dashboards")
    tb = s2.shapes.add_textbox(Inches(7.1), Inches(2.5), Inches(5.1), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_fail = [
        ("The 'Wall of 50 Graphs': ", "Dense multi-channel line charts overload astronauts with raw data they cannot interpret under stress."),
        ("Acute Alarm Fatigue: ", "Constantly flashing red alarms desensitize crew members, leading to missed critical signals."),
        ("No Actionable Synthesis: ", "Hospital ICU monitors report vital statistics but fail to answer: 'What do I do right now?'"),
        ("The Calm Cockpit Remedy: ", "NASA-STD-3001 compliant glanceable spatial mental models with zero cognitive friction.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_fail):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = ACCENT_BLUE
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(10)

    s2.notes_slide.notes_text_frame.text = (
        "Minute 2: Highlight the cognitive engineering problem. "
        "Astronauts are not doctors; presenting 50 charts creates panic and alarm fatigue. "
        "HELIX applies NASA Calm Cockpit principles to replace charts with spatial intelligence."
    )

    # ==========================================
    # SLIDE 3: 3D Ghost Twin & Health Runway
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Spatial Physiological Intelligence", "The 3D Ghost Twin & Predictive Health Runway™")

    # Left: 3D Ghost Twin
    add_card(s3, Inches(0.8), Inches(1.8), Inches(6.4), Inches(4.9), "The 3D Ghost Twin (Three.js WebGL)")
    tb = s3.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.8), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_twin = [
        ("Ghost Earth Baseline: ", "Translucent blue wireframe represents pre-launch Earth physiology directly behind current in-flight state."),
        ("4 Anatomic Inspection Layers: ", "Instant toggle between Skeleton, Organs, Muscles, and Suit."),
        ("Spatial Hotspots: ", "Clickable 3D anatomical markers (Brain, Spine, Heart, Eyes) with cinematic smooth camera fly-to."),
        ("Zero-Allocation 60 FPS: ", "Module-scope Three.js math vectors with automatic graceful 2D SVG fallback on low-power hardware.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_twin):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = ACCENT_CYAN
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(10)

    # Right: Predictive Runway
    add_card(s3, Inches(7.5), Inches(1.8), Inches(5.0), Inches(4.9), "Predictive Health Runway™")
    tb = s3.shapes.add_textbox(Inches(7.8), Inches(2.5), Inches(4.4), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_runway = [
        ("Countdown, Not Alarm: ", "Calculates clinical runway days before a physiological system breaches safety envelopes."),
        ("NASA HRP Reference Bounds: ", "Heart Rate: 50–90 bpm; SpO2: ≥96%; Core Temp: 36.1–37.2°C; ONSD: <5.0 mm."),
        ("Compounding Hazard Matrix: ", "Radiation flares, microgravity float, and isolation act as non-linear degradation multipliers."),
        ("Proactive Scheduling: ", "Transforms medical crises into scheduled, manageable countermeasure maintenance.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_runway):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = ACCENT_BLUE
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(10)

    s3.notes_slide.notes_text_frame.text = (
        "Minute 3: Demonstrate the 3D twin live. "
        "Point to the blue Earth wireframe ghost behind the skeleton. "
        "Explain that the Runway gives '18 days before spine caution' instead of waiting for irreversible damage."
    )

    # ==========================================
    # SLIDE 4: Hardware Sensor Ingestion
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Hardware-Grade Telemetry", "Continuous Smart Shirt Ingestion & 60 FPS Oscilloscope")

    # Top Hero Card: Bio-Monitor Profile
    add_card(s4, Inches(0.8), Inches(1.8), Inches(11.7), Inches(2.2), "Bio-Monitor BLE Telemetry Pipeline (CSA / Hexoskin Profile)")
    tb = s4.shapes.add_textbox(Inches(1.1), Inches(2.4), Inches(11.1), Inches(1.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = (
        "HELIX interfaces with smart-fabric biometric garments (similar to the Canadian Space Agency Bio-Monitor "
        "flown on the ISS). Bluetooth Low Energy GATT services stream real-time cardiorespiratory biometrics "
        "with zero human intervention."
    )
    p.font.size = Pt(14)
    p.font.color.rgb = TEXT_LIGHT

    # Three Bottom Feature Columns
    add_card(s4, Inches(0.8), Inches(4.3), Inches(3.7), Inches(2.5), "60 FPS ECG Trace")
    tb = s4.shapes.add_textbox(Inches(1.0), Inches(5.0), Inches(3.3), Inches(1.6))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "HTML5 Canvas rendering P-wave, QRS complex, and T-wave with phosphor decay trail physics."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_MUTED

    add_card(s4, Inches(4.8), Inches(4.3), Inches(3.7), Inches(2.5), "Motion Artifact Filtering")
    tb = s4.shapes.add_textbox(Inches(5.0), Inches(5.0), Inches(3.3), Inches(1.6))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Adaptive digital filter isolates true cardiac depolarization from treadmill and ergometer movement noise."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_MUTED

    add_card(s4, Inches(8.8), Inches(4.3), Inches(3.7), Inches(2.5), "1-Click Twin Ingestion", ACCENT_CYAN)
    tb = s4.shapes.add_textbox(Inches(9.0), Inches(5.0), Inches(3.3), Inches(1.6))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Telemetry feeds directly into the 3D twin's cardiovascular state machine and advances daily Measure rings."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_LIGHT

    s4.notes_slide.notes_text_frame.text = (
        "Minute 4: Show the live ECG oscilloscope in the modal. "
        "Point out the 60 FPS trace line, demonstrate the exercise noise toggle, and click 'Stream to Twin'."
    )

    # ==========================================
    # SLIDE 5: Ambient Diagnostics (Audio & CV)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Ambient Biomarkers", "Web Audio Acoustic Stress & Computer Vision Ultrasound")

    # Left: Voice Biomarkers
    add_card(s5, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.9), "5-Second Voice Check-In (Web Audio API)")
    tb = s5.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.1), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_voice = [
        ("Zero Friction Intake: ", "Uses cabin microphone to extract sub-clinical acoustic markers in 5 seconds."),
        ("Pitch Jitter (ms): ", "Measures micro-tremors in vocal cord oscillation indicating acute stress."),
        ("Harmonics-to-Noise Ratio (HNR): ", "Quantifies vocal fold strain and hoarseness in decibels (dB)."),
        ("Speech Articulation Tempo: ", "Detects psychomotor deceleration caused by severe sleep debt."),
        ("Cognitive Readiness Index: ", "Calculates 0–100% readiness score directly driving the 3D brain/sleep halo.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_voice):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(12.5)
        run1.font.color.rgb = ACCENT_AMBER
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(12.5)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    # Right: CV Ultrasound
    add_card(s5, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9), "AI Ultrasound & SANS Checker (Computer Vision)")
    tb = s5.shapes.add_textbox(Inches(7.1), Inches(2.5), Inches(5.1), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_cv = [
        ("The SANS Emergency: ", "Spaceflight-Associated Neuro-ocular Syndrome causes permanent vision loss."),
        ("Acoustic Gel Coupling Check: ", "Analyzes border dark zones to warn crew if probe lacks ultrasound gel."),
        ("Laplacian Edge Sharpness: ", "Calculates gradient variance to prevent blurry motion-artifact captures."),
        ("96% Target Reticle Lock: ", "Guides non-physicians to lock crosshairs onto the Optic Nerve Sheath (ONSD)."),
        ("1-Click Reference Scan: ", "Instant synthetic SANS ultrasound with 5.2 mm calipers for live demonstrations.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_cv):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(12.5)
        run1.font.color.rgb = ACCENT_CYAN
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(12.5)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    s5.notes_slide.notes_text_frame.text = (
        "Minute 5: Show the Voice Check-In modal and the 5-second frequency spectrum. "
        "Then show the Computer Vision ultrasound SANS demo scan with the 96% target lock."
    )

    # ==========================================
    # SLIDE 6: One Thing Today & Ground Sync
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Actionable Autonomy", "The 'One Thing Today' Engine & Asynchronous Ground Sync")

    # Left: One Thing Today
    add_card(s6, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.9), "The 'One Thing Today' Action Engine")
    tb = s6.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.1), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_action = [
        ("Cognitive Paralysis Cure: ", "Distills multi-hazard risks into exactly ONE prioritized, evidence-backed countermeasure per shift."),
        ("Example Protocols: ", "'Conduct 45-min ARED Resistive Load Protocol to arrest lumbar spine demineralization.'"),
        ("Equipment Down? Contingency: ", "What if gym hardware breaks down? One click recalculates workout with resistance bands."),
        ("Calm Shift Reminders: ", "Non-intrusive reminder system synchronizes with spacecraft circadian lighting cycles.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_action):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = ACCENT_BLUE
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(10)

    # Right: Store-and-Forward Ground Sync
    add_card(s6, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.9), "44-Minute Comms: Store-and-Forward Sync")
    tb = s6.shapes.add_textbox(Inches(7.1), Inches(2.5), Inches(5.1), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_sync = [
        ("SBAR Clinical Ground Packet: ", "Automatically formats telemetry into Situation, Background, Assessment, Recommendation."),
        ("Local Store-and-Forward Queue: ", "Buffers telemetry in local storage during planetary occlusion or comms blackouts."),
        ("Burst Telemetry Uplink: ", "When high-gain ground pass opens, transmits compressed delta packets to Houston."),
        ("Role-Based Crew Privacy: ", "Detailed biometrics encrypted client-side; crew view shows only aggregate buddy-checks.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_sync):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = ACCENT_CYAN
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(10)

    s6.notes_slide.notes_text_frame.text = (
        "Minute 6: Demonstrate how HELIX translates data into action. "
        "Show 'Equipment Down? Use Backup' and open the Flight Surgeon Summary tab showing the SBAR packet."
    )

    # ==========================================
    # SLIDE 7: Technical Stack, Earth Impact & Roadmap
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "The Road to Mars & Earth", "Engineering Stack, Terrestrial Impact & 6-Month Roadmap")

    # Three Cards Across
    add_card(s7, Inches(0.8), Inches(1.8), Inches(3.7), Inches(4.9), "Engineering Stack")
    tb = s7.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(3.3), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_stack = [
        ("100% Offline-First: ", "Local state persistence; zero cloud dependencies."),
        ("Frontend: ", "React, TypeScript, Three.js, Web Audio API, TailwindCSS."),
        ("Backend: ", "FastAPI & Express with Google Identity + JWT."),
        ("Dual Orbital Themes: ", "Deep Space Dark (scotopic vision) & Orbital Day (solar albedo).")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_stack):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = "• " + b_title + b_desc
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    add_card(s7, Inches(4.8), Inches(1.8), Inches(3.7), Inches(4.9), "Terrestrial Impact")
    tb = s7.shapes.add_textbox(Inches(5.0), Inches(2.5), Inches(3.3), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_earth = [
        ("Antarctic Research Stations: ", "Identical extreme isolation and comms latency."),
        ("Naval Submarine Crews: ", "Months submerged under radio silence."),
        ("Rural Telehealth: ", "Guiding non-physicians with AI ultrasound and voice screening."),
        ("Combat Medics: ", "Autonomous triage in comms-blackout combat zones.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_earth):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = "• " + b_title + b_desc
        p.font.size = Pt(12)
        p.font.color.rgb = ACCENT_CYAN
        p.space_after = Pt(8)

    add_card(s7, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.9), "6-Month Roadmap", ACCENT_AMBER)
    tb = s7.shapes.add_textbox(Inches(9.0), Inches(2.5), Inches(3.3), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True
    bullets_road = [
        ("Hardware Integration: ", "Pair Butterfly iQ probe & Hexoskin smart shirt over live BLE."),
        ("Parabolic Flight Testing: ", "Validate 3D twin touch targets under microgravity and 2G."),
        ("NASA ExMC Submission: ", "Submit to the Exploration Medical Capability solicitation.")
    ]
    for i, (b_title, b_desc) in enumerate(bullets_road):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = "• " + b_title + b_desc
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    s7.notes_slide.notes_text_frame.text = (
        "Minute 7 Conclusion: Deliver the closing vision. "
        "HELIX keeps astronauts alive to Mars and back, while transforming isolated healthcare on Earth."
    )

    prs.save(output_path)
    print(f"Successfully generated presentation deck: {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "d:/Helix/HELIX_Presentation.pptx"
    create_helix_deck(out_file)
