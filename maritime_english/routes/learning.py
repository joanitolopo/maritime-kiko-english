from flask import Blueprint, render_template, redirect, url_for, flash, current_app, abort, flash
from flask_login import login_required, current_user
import json
import os
import speech_recognition as speech_recog

learning_bp = Blueprint('learning', __name__, url_prefix='/learn')

UNITS = {
    1: {"title": "Spell the Sea", 
        "subtitle": "Maritime Alphabet and Numbers", 
        "image": "unit_abc.png", # Ganti dengan path gambar Anda
        "sections": ["warmup", "input_intro", "input_alphabet", "input_numbers", 
                     "input_mmsi", "input_channel", "input_vhf", "input_wrapup", 
                     "noticing_intro", "noticing_alphabet", "noticing_numbers", "noticing_wrapup",
                     "controlled_practice_intro", "controlled_ex_1", "controlled_ex_2", "controlled_ex_3",
                     "controlled_ex_4", "controlled_wrapup", "guided_intro", "guided_task_1",
                     "guided_task_2", "guided_task_3", "guided_task_4", "guided_wrapup",
                     "authentic_intro", "authentic_task_1", "authentic_task_2", "authentic_task_3", 
                     "authentic_task_4", "authentic_wrapup", 'assessment_intro', 'assessment_letters', 'assessment_numbers',
                     'assessment_spelling', 'assessment_mmsi', 'assessment_channel', 'assessment_distress', 'assessment_call',
                     'assessment_identify_emergency', 'assessment_dialogue', 'assessment_open_ended']},
    2: {"title": "Signal and Respond", 
        "subtitle": "Time, Distress Calls, and Basic Commands", 
        "image": "unit_radio.png", # Ganti dengan path gambar Anda
        "sections": ["warm_up", "lesson_a", "quiz"]},
    3: {"title": "Welcome Aboard!", 
        "subtitle": "Sharing Personal Information at Sea", 
        "image": "unit_person.png", # Ganti dengan path gambar Anda
        "sections": ["warm_up", "lesson_a", "quiz"]},
    4: {"title": "Meet the Crew", 
        "subtitle": "Ranks, Roles, and Responsibilities on Board", 
        "image": "unit_crew.png", # Ganti dengan path gambar Anda
        "sections": ["warm_up", "lesson_a", "quiz"]},
    5: {"title": "Know Your Ship", 
        "subtitle": "Exploring Ship Parts and Positions", 
        "image": "unit_ship.png", # Ganti dengan path gambar Anda
        "sections": ["warm_up", "lesson_a", "quiz"]},
    6: {"title": "Emergency Ready!", 
        "subtitle": "Commands and Actions in Critical Moments", 
        "image": "unit_vest.png", # Ganti dengan path gambar Anda
        "sections": ["warm_up", "lesson_a", "quiz"]},
}

@learning_bp.route('/courses')
@login_required
def courses_page():
    # Cukup render template dan kirimkan data UNITS
    return render_template('courses.html', units_data=UNITS)


def load_unit_content_or_abort(unit_id):
    path = os.path.join(current_app.static_folder, 'data', 'units', f'unit_{unit_id}.json')
    if not os.path.exists(path):
        abort(404, description=f'Unit content for unit_{unit_id} not found.')
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data


@learning_bp.route("/unit/<int:unit_id>/introduction")
@login_required
def unit_introduction(unit_id):
    if unit_id not in UNITS:
        flash("Unit not found.")
        return redirect(url_for('main.home'))
    template_path = f'unit_{unit_id}/introduction.html'
    return render_template(template_path, unit_id=unit_id, unit_data=UNITS[unit_id])

@learning_bp.route("/unit/<int:unit_id>/warmup")
@login_required
def warmup_introduction(unit_id):
    if unit_id not in UNITS:
        flash("Unit not found.")
        return redirect(url_for('main.home'))
    template_path = f'unit_{unit_id}/warmup.html'
    return render_template(template_path, unit_id=unit_id, unit_data=UNITS[unit_id])


@learning_bp.route('/unit/<int:unit_id>/<string:section>')
@login_required
def learning_unit(unit_id, section):
    if unit_id not in UNITS or section not in UNITS[unit_id]['sections']:
        flash("Unit or section not found.")
        return redirect(url_for('main.home'))
    
    # load unit content from JSON
    content_full = load_unit_content_or_abort(unit_id)
    if section not in content_full:
        abort(404, description=f"Section '{section}' not found in unit_{unit_id} content.")
    section_content = content_full[section]
    template_path = f'{section}.html'

    return render_template(template_path, 
                           unit_id=unit_id, 
                           section=section, 
                           unit_data=UNITS[unit_id],
                           content=content_full,
                           section_content=section_content)

@learning_bp.route('/report')
@login_required
def report():
    # --- Data Progres Tiruan (Mock Data) ---
    # Di aplikasi nyata, Anda akan mengambil data ini dari database
    # berdasarkan current_user.id
    mock_progress_data = {
        "1": {
            "status": "Completed",
            "progress": 100,
            "score": 93,
            "last_activity": "10 Nov 2025"
        },
        "2": {
            "status": "In Progress",
            "progress": 75,
            "score": 0, # Sesuai gambar
            "last_activity": "12 Nov 2025"
        },
        "3": {
            "status": "Locked",
            "progress": 0,
            "score": 0,
            "last_activity": "Not Yet Started"
        },
        "4": {
            "status": "Locked",
            "progress": 0,
            "score": 0,
            "last_activity": "Not Yet Started"
        },
        "5": {
            "status": "Locked",
            "progress": 0,
            "score": 0,
            "last_activity": "Not Yet Started"
        },
        "6": {
            "status": "Locked",
            "progress": 0,
            "score": 0,
            "last_activity": "Not Yet Started"
        }
    }
    # ------------------------------------

    # Data default jika unit baru ditambahkan tapi belum ada di mock data
    default_progress = {
        "status": "Locked", "progress": 0, "score": 0, "last_activity": "Not Yet Started"
    }

    return render_template('report.html', 
                           units_data=UNITS, 
                           progress_data=mock_progress_data,
                           default_progress=default_progress)