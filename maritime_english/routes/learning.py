from flask import Blueprint, render_template, redirect, url_for, flash, current_app, abort, flash, request
from flask_login import login_required, current_user
import json
import os
import speech_recognition as speech_recog
from ..models import UnitProgress, UserStats
from ..__init__ import db
from datetime import date
from datetime import datetime
from flask import jsonify

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

def update_user_stats(user_id, stats_object=None):
    """
    Menghitung ulang dan memperbarui tabel UserStats berdasarkan 
    data terbaru di UnitProgress.
    """
    current_app.logger.debug(f"[update_user_stats] Dipanggil untuk user {user_id}")
    
    # 1. Gunakan stats_object jika diberikan, jika tidak, cari di DB
    stats = stats_object
    if not stats:
        current_app.logger.debug("[update_user_stats] stats_object tidak diberikan, mencari di DB...")
        stats = UserStats.query.filter_by(user_id=user_id).first()

    if not stats:
        # Ini sebagai pengaman jika UserStats belum ada
        current_app.logger.warning(f"[update_user_stats] UserStats tidak ditemukan untuk user {user_id}. Membuat baru.")
        stats = UserStats(user_id=user_id)
        db.session.add(stats) # Tambahkan ke sesi HANYA jika ini objek baru

    # 2. Ambil semua progres unit milik user, urutkan berdasarkan unit_id
    all_progress = UnitProgress.query.filter_by(user_id=user_id).order_by(UnitProgress.unit_id).all()

    # 3. Hitung total unit yang selesai
    total_completed = sum(1 for p in all_progress if p.status == 'completed')
    stats.total_units_completed = total_completed

    # 4. Tentukan unit saat ini (current unit)
    current_unit_prog = None
    
    # Prioritas 1: Cari unit yang 'in_progress'
    for p in all_progress:
        if p.status == 'in_progress':
            current_unit_prog = p
            break
    
    # Prioritas 2: Jika tidak ada, cari unit 'not_started' pertama
    if not current_unit_prog:
        for p in all_progress:
            if p.status == 'not_started':
                current_unit_prog = p
                break
    
    # 5. Update data stats berdasarkan hasil temuan
    if not current_unit_prog:
        total_units_in_system = len(UNITS)
        
        if total_completed >= total_units_in_system and total_completed > 0:
            stats.current_unit_name = "All Units Completed!"
            stats.current_unit_progress = 100
        else:
            stats.current_unit_name = UNITS.get(1, {}).get("title", "Spelling the Sea")
            stats.current_unit_progress = 0
            
    else:
        unit_info = UNITS.get(current_unit_prog.unit_id)
        
        if unit_info:
            stats.current_unit_name = unit_info.get("title", "Unknown Unit")
        else:
            stats.current_unit_name = "Unknown Unit"
            
        stats.current_unit_progress = current_unit_prog.progress_percent

    # 6. HAPUS 'db.session.add(stats)' DARI SINI.
    #    Objek ini sudah ada di dalam 'session' dan akan di-commit
    #    oleh fungsi 'complete_subunit'. Kita hanya memodifikasi nilainya.
    current_app.logger.debug(f"[update_user_stats] Selesai. Stats: Unit='{stats.current_unit_name}', Progress={stats.current_unit_progress}%, Completed={stats.total_units_completed}")


@learning_bp.route('/courses')
@login_required
def courses_page():
    # 1. Ambil semua progres unit untuk pengguna yang sedang login
    user_progress = UnitProgress.query.filter_by(user_id=current_user.id).all()
    
    # 2. Ubah data progres menjadi dictionary agar mudah diakses di template
    #    Formatnya: {1: {'status': 'in_progress', 'completed_subunits': 1, 'progress_percent': 11}, 2: {...}}
    progress_data = {
        progress.unit_id: {
            "status": progress.status,
            "completed_subunits": progress.completed_subunits,
            "progress_percent": progress.progress_percent
        } for progress in user_progress
    }

    # 3. Kirimkan 'units_data' (info unit) DAN 'progress_data' (info user) ke template
    return render_template('courses.html', 
                           units_data=UNITS, 
                           progress_data=progress_data)


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


# Peta ini menerjemahkan subunit_index (dari JS) ke nama 'section' (dari Python)
# Ini adalah "lem" antara frontend (modal) dan backend (routes)
SUBUNIT_TO_SECTION_MAP = {
    1: { # Unit 1
        1: 'introduction',    # Part A -> rute unit_introduction
        2: 'warmup',          # Part B -> rute learning_unit(section='warmup')
        3: 'input_alphabet', 
        4: 'noticing_intro',     # Part C -> rute learning_unit(section='input_intro')
        5: 'noticing_numbers',  # Part D -> rute learning_unit(section='noticing_intro')
        6: 'noticing_alphabet', # Part E
        7: 'guided_intro',    # Part F
        8: 'guided_task_1',
        9: 'guided_task_2', # Part G
    },
    2: { # Unit 2 (Dummy - sesuai permintaan Anda)
        1: 'warm_up',
        2: 'lesson_a',
        3: 'quiz'
        # Saat Anda membuat subunit data untuk Unit 2 di JS, Anda harus mencocokkannya di sini
    }
    # Tambahkan Unit 3, 4, 5, 6 di sini nanti saat Anda membuatnya
}

@learning_bp.route("/unit/<int:unit_id>/subunit/<int:subunit_index>")
@login_required
def subunit_page(unit_id, subunit_index):
    """
    Route "Penerjemah" (Translator Route).
    Endpoint ini dipanggil oleh modal di courses.js.
    Ia menerima subunit_index (1-9) dan me-redirect ke route Flask 
    yang benar (baik 'unit_introduction' atau 'learning_unit' dengan 
    'section' yang tepat).
    """
    
    # 1. Cek apakah unit_id ada di peta
    unit_map = SUBUNIT_TO_SECTION_MAP.get(unit_id)
    if not unit_map:
        flash("Sorry, this unit is not yet available.", "warning")
        return redirect(url_for('learning.courses_page'))

    # 2. Cek apakah subunit_index ada di peta untuk unit tersebut
    section_name = unit_map.get(subunit_index)
    if not section_name:
        # Jika ini unit dummy, beri pesan ramah
        if unit_id > 1:
            flash("This part of the unit is not available yet.", "info")
            return redirect(url_for('learning.courses_page'))
        
        # Jika ini Unit 1, berarti ada error konfigurasi
        current_app.logger.error(f"Subunit index {subunit_index} not defined for unit {unit_id} in SUBUNIT_TO_SECTION_MAP.")
        abort(404, f"Subunit index {subunit_index} not defined for unit {unit_id}.")

    # --- 3. Logika Redirect ---

    # Kasus Khusus 1: Part A (Introduction)
    # Ini me-redirect ke route @learning_bp.route("/unit/<int:unit_id>/introduction")
    if section_name == 'introduction':
        return redirect(url_for('learning.unit_introduction', unit_id=unit_id))
            
    # Kasus Khusus 2: Part I (Reflection)
    # Ini me-redirect ke route @learning_bp.route("/unit/<int:unit_id>/reflection")
    if section_name == 'reflection':
        return redirect(url_for('learning.unit_reflection', unit_id=unit_id))

    # Kasus Normal (Part B-H): Redirect ke 'learning_unit'
    
    # Verifikasi keamanan: pastikan section_name ada di dict UNITS
    if section_name not in UNITS.get(unit_id, {}).get('sections', []):
        flash(f"Error: Section '{section_name}' configuration is missing.", "danger")
        current_app.logger.error(f"Mapping error: Section '{section_name}' not in UNITS[{unit_id}]['sections'].")
        return redirect(url_for('learning.courses_page'))
         
    # Ini me-redirect ke route @learning_bp.route('/unit/<int:unit_id>/<string:section>')
    return redirect(url_for('learning.learning_unit', unit_id=unit_id, section=section_name))


@learning_bp.route("/unit/<int:unit_id>/reflection")
@login_required
def unit_reflection(unit_id):
    """
    Halaman placeholder untuk 'Log Your Learning Journey' (Part I).
    """
    if unit_id not in UNITS:
        abort(404, "Unit not found")
    
    # Anda perlu membuat template 'unit_reflection.html'
    # Untuk sekarang, kita bisa gunakan 'base.html' dan 'block content' sederhana
    
    # TODO: Ganti ini dengan render_template 'unit_reflection.html' nanti
    return f"<h1>Unit {unit_id} Reflection (Part I)</h1><p>Halaman ini sedang dibuat.</p><a href='{url_for('learning.courses_page')}'>Kembali ke Courses</a>"


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


@learning_bp.route("/unit/<int:unit_id>/complete/<int:subunit_index>")
@login_required
def complete_subunit(unit_id, subunit_index):
    """
    Endpoint ini melacak kemajuan dan mengarahkan ke subunit berikutnya.
    Ini dipanggil KETIKA pengguna mengklik 'Continue' di akhir sebuah bagian.
    """
    
    # 1. Tentukan ada berapa total subunit di unit ini
    total_subunits = len(SUBUNIT_TO_SECTION_MAP.get(unit_id, {}))
    if total_subunits == 0:
        flash("Unit configuration error.", "danger")
        return redirect(url_for('learning.courses_page'))

    # 2. Cari atau Buat rekaman progres untuk user dan unit ini
    progress = UnitProgress.query.filter_by(
        user_id=current_user.id, 
        unit_id=unit_id
    ).first()

    if not progress:
        # --- PERBAIKAN DI SINI ---
        # Saat membuat rekaman baru, kita harus eksplisit mengatur default-nya
        # agar atributnya tidak 'None' di Python.
        progress = UnitProgress(
            user_id=current_user.id, 
            unit_id=unit_id,
            completed_subunits=0,  # <-- INI PERBAIKAN UTAMANYA
            progress_percent=0,
            status='not_started'
        )
        db.session.add(progress)
        # --- AKHIR PERBAIKAN ---

    # 3. Update progres HANYA JIKA ini adalah subunit baru yang diselesaikan
    #    Sekarang 'progress.completed_subunits' dijamin 0 (sebagai int)
    if subunit_index > progress.completed_subunits:
        progress.completed_subunits = subunit_index
        
    # 4. Hitung ulang persentase dan status
    #    Kita gunakan 'max(1, ...)' untuk menghindari pembagian dengan nol jika total_subunits = 0
    progress.progress_percent = int((progress.completed_subunits / max(1, total_subunits)) * 100)
    
    if progress.completed_subunits >= total_subunits:
        progress.status = 'completed'
        progress.progress_percent = 100 # Pastikan 100%
    elif progress.completed_subunits > 0:
        progress.status = 'in_progress'
    else:
        progress.status = 'not_started'


    # Ambil durasi dari query parameter URL (?duration_sec=...)
    duration_str = request.args.get('duration_sec', '0')
    try:
        duration_seconds = int(duration_str)
    except ValueError:
        duration_seconds = 0

    # Ubah ke menit (bulatkan ke menit terdekat)
    duration_minutes = round(duration_seconds / 60)

    # Hanya tambahkan jika waktunya signifikan (lebih dari 0 menit setelah dibulatkan)
    stats = current_user.stats
    if not stats:
        current_app.logger.warning(f"[complete_subunit] UserStats tidak ditemukan untuk {current_user.id}. Membuat baru.")
        stats = UserStats(user_id=current_user.id)
        db.session.add(stats)
    
    # Pastikan nilai awal bukan None
    if stats.total_learning_time_minutes is None:
        stats.total_learning_time_minutes = 0
    if stats.minutes_today is None: # Cek untuk kolom baru juga
        stats.minutes_today = 0
    
    today = date.today()
    current_app.logger.debug(f"[complete_subunit] Tanggal hari ini: {today}. Last active: {stats.last_active_date}")

    # Cek apakah ini hari yang baru (atau pertama kali)
    if stats.last_active_date != today:
        current_app.logger.debug("[complete_subunit] Hari baru terdeteksi! Mereset 'minutes_today'.")
        stats.minutes_today = 0 # Reset counter harian
        stats.last_active_date = today # Set hari ini sebagai hari aktif
    
    # Tambahkan durasi (jika lebih dari 0) ke TOTAL dan HARIAN
    if duration_minutes > 0:
        stats.total_learning_time_minutes += duration_minutes
        stats.minutes_today += duration_minutes
        current_app.logger.debug(f"[complete_subunit] Menambahkan {duration_minutes} menit. Total harian baru: {stats.minutes_today}, Total keseluruhan baru: {stats.total_learning_time_minutes}")
    else:
        current_app.logger.debug("[complete_subunit] Durasi < 30 detik, waktu belajar tidak ditambahkan.")
    

    # --- 6. Panggil update_user_stats (DENGAN OBJEK) ---
    current_app.logger.debug("[complete_subunit] Memanggil update_user_stats...")
    update_user_stats(current_user.id, stats_object=stats)

    # --- TRACKING BARU ---
    # Update last_attempt timestamp
    progress.last_attempt = datetime.utcnow()

    # Tambahkan durasi ke total_duration unit ini
    if duration_minutes > 0:
        if progress.total_duration_minutes is None:
            progress.total_duration_minutes = 0
        progress.total_duration_minutes += duration_minutes
    
    if subunit_index == 1:  # Hanya increment jika mulai dari awal
        if progress.total_attempts is None:
            progress.total_attempts = 0
        progress.total_attempts += 1

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error committing progress: {e}")
        flash("An error occurred while saving your progress.", "danger")
        return redirect(url_for('learning.courses_page'))

    # 5. Tentukan ke mana harus me-redirect
    next_subunit_index = subunit_index + 1
    
    if next_subunit_index > total_subunits:
        # Jika sudah selesai, kembalikan ke halaman courses
        flash("Unit completed! Well done, Cadet!", "success")
        return redirect(url_for('learning.courses_page'))
    else:
        # Arahkan ke subunit berikutnya menggunakan route 'subunit_page'
        return redirect(url_for('learning.subunit_page', 
                                unit_id=unit_id, 
                                subunit_index=next_subunit_index))

@learning_bp.route("/unit/<int:unit_id>/save_reflection", methods=['POST'])
@login_required
def save_reflection(unit_id):
    """
    Endpoint untuk menyimpan self-assessment dan reflection notes dari guided_task_2.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "No data received"}), 400
    
    # Cari atau buat UnitProgress
    progress = UnitProgress.query.filter_by(
        user_id=current_user.id,
        unit_id=unit_id
    ).first()
    
    if not progress:
        progress = UnitProgress(
            user_id=current_user.id,
            unit_id=unit_id,
            completed_subunits=0,
            progress_percent=0,
            status='not_started',
            total_attempts=0,
            total_duration_minutes=0
        )
        db.session.add(progress)
    
    # Update self-assessment scores
    if 'q1' in data:
        progress.self_assessment_q1 = int(data['q1'])
    if 'q2' in data:
        progress.self_assessment_q2 = int(data['q2'])
    if 'q3' in data:
        progress.self_assessment_q3 = int(data['q3'])
    
    # Update reflection notes
    if 'r1' in data:
        progress.reflection_easiest = data['r1']
    if 'r2' in data:
        progress.reflection_struggle = data['r2']
    if 'r3' in data:
        progress.reflection_improvement = data['r3']
    
    # Update last_attempt
    progress.last_attempt = datetime.utcnow()
    
    try:
        db.session.commit()
        current_app.logger.info(f"Reflection saved for user {current_user.id}, unit {unit_id}")
        return jsonify({"success": True, "message": "Reflection saved successfully!"})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving reflection: {e}")
        return jsonify({"success": False, "message": "Failed to save reflection"}), 500


@learning_bp.route("/unit/<int:unit_id>/save_assessment", methods=['POST'])
@login_required
def save_assessment(unit_id):
    """
    Endpoint untuk menyimpan assessment scores dari guided_task_1 (Activity 9).
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "No data received"}), 400
    
    # Cari atau buat UnitProgress
    progress = UnitProgress.query.filter_by(
        user_id=current_user.id,
        unit_id=unit_id
    ).first()
    
    if not progress:
        progress = UnitProgress(
            user_id=current_user.id,
            unit_id=unit_id,
            completed_subunits=0,
            progress_percent=0,
            status='not_started',
            total_attempts=0,
            total_duration_minutes=0
        )
        db.session.add(progress)
    
    # Update assessment scores
    task1 = int(data.get('task1', 0))
    task2 = int(data.get('task2', 0))
    task3 = int(data.get('task3', 0))
    
    progress.assessment_task1_score = task1
    progress.assessment_task2_score = task2
    progress.assessment_task3_score = task3
    progress.assessment_total_score = task1 + task2 + task3
    progress.assessment_percentage = round((progress.assessment_total_score / 15) * 100, 1)
    
    # Update last_attempt
    progress.last_attempt = datetime.utcnow()
    
    try:
        db.session.commit()
        current_app.logger.info(f"Assessment saved for user {current_user.id}, unit {unit_id}: {progress.assessment_total_score}/15")
        return jsonify({
            "success": True, 
            "message": "Assessment saved successfully!",
            "total_score": progress.assessment_total_score,
            "percentage": progress.assessment_percentage
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving assessment: {e}")
        return jsonify({"success": False, "message": "Failed to save assessment"}), 500

@learning_bp.route("/unit/<int:unit_id>/report_pdf")
@login_required
def unit_report_pdf(unit_id):
    """
    Halaman report PDF untuk unit tertentu.
    """
    if unit_id not in UNITS:
        flash("Unit not found.", "error")
        return redirect(url_for('learning.report'))
    
    # Ambil progress untuk unit ini
    progress = UnitProgress.query.filter_by(
        user_id=current_user.id,
        unit_id=unit_id
    ).first()
    
    if not progress:
        flash("No progress data found for this unit.", "warning")
        return redirect(url_for('learning.report'))
    
    # Hitung self-assessment level
    avg_score = None
    level_label = None
    captain_feedback = None
    
    if progress.self_assessment_q1 and progress.self_assessment_q2 and progress.self_assessment_q3:
        avg_score = round((progress.self_assessment_q1 + progress.self_assessment_q2 + progress.self_assessment_q3) / 3, 1)
        
        if avg_score >= 3.5:
            level_label = "High Confidence"
        elif avg_score >= 2.5:
            level_label = "Steady Progress"
        elif avg_score >= 1.5:
            level_label = "Developing Confidence"
        else:
            level_label = "Emerging Skills"
        
        easiest = progress.reflection_easiest or "certain tasks"
        struggle = progress.reflection_struggle or "some challenges"
        improvement = progress.reflection_improvement or "practice more"
        
        captain_feedback = generate_captain_feedback(level_label, easiest, struggle, improvement)
    
    # Data untuk template
    report_data = {
        "unit_id": unit_id,
        "unit_title": UNITS[unit_id]["title"],
        "status": "Completed" if progress.status == 'completed' else \
                  ("In Progress" if progress.status == 'in_progress' else "Not Yet Started"),
        "total_attempts": progress.total_attempts or 0,
        "total_duration": progress.total_duration_minutes or 0,
        "last_attempt": progress.last_attempt.strftime('%d/%m/%Y') if progress.last_attempt else "Never",
        "self_assessment": {
            "q1": progress.self_assessment_q1,
            "q2": progress.self_assessment_q2,
            "q3": progress.self_assessment_q3,
            "avg_score": avg_score,
            "level_label": level_label,
        },
        "reflections": {
            "easiest": progress.reflection_easiest or "",
            "struggle": progress.reflection_struggle or "",
            "improvement": progress.reflection_improvement or "",
        },
        "captain_feedback": captain_feedback,
        "assessment": {
            "task1": progress.assessment_task1_score,
            "task2": progress.assessment_task2_score,
            "task3": progress.assessment_task3_score,
            "total": progress.assessment_total_score,
            "percentage": progress.assessment_percentage
        }
    }
    
    # Generate dummy daily data (nanti bisa diganti dengan data real)
    # Untuk sekarang, kita buat placeholder
    from datetime import datetime, timedelta
    import random
    
    today = datetime.now()
    daily_data = []
    for i in range(7):
        day = today - timedelta(days=6-i)
        daily_data.append({
            "day": day.strftime('%a'),
            "attempts": random.randint(0, 3)  # Placeholder - nanti ganti dengan data real
        })
    
    # Hitung stats
    active_days = sum(1 for d in daily_data if d["attempts"] > 0)
    total_attempts_week = sum(d["attempts"] for d in daily_data)
    avg_attempts = round(total_attempts_week / 7, 1) if total_attempts_week > 0 else 0
    avg_minutes = round(report_data["total_duration"] / max(1, active_days))
    
    # Longest streak (simplified)
    current_streak = 0
    max_streak = 0
    for d in daily_data:
        if d["attempts"] > 0:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0
    
    stats = {
        "active_days": active_days,
        "avg_attempts": avg_attempts,
        "avg_minutes": avg_minutes,
        "longest_streak": max_streak
    }
    
    return render_template('unit_report_pdf.html',
                           user=current_user,
                           report_data=report_data,
                           daily_data=daily_data,
                           stats=stats,
                           today=today.strftime('%d/%m/%Y'))

@learning_bp.route('/report')
@login_required
def report():
    user_progress = UnitProgress.query.filter_by(user_id=current_user.id).all()
    
    progress_data = {}
    completed_count = 0
    total_duration = 0
    total_attempts = 0
    total_progress_sum = 0
    
    for progress in user_progress:
        status_text = "Completed" if progress.status == 'completed' else \
                      ("In Progress" if progress.status == 'in_progress' else "Not Yet Started")
        
        if status_text == "Completed":
            completed_count += 1
        
        duration = progress.total_duration_minutes or 0
        attempts = progress.total_attempts or 0
        prog_percent = progress.progress_percent or 0
        
        total_duration += duration
        total_attempts += attempts
        total_progress_sum += prog_percent
        
        # Calculate average score and level
        avg_score = None
        level_label = None
        captain_feedback = None
        
        if progress.self_assessment_q1 and progress.self_assessment_q2 and progress.self_assessment_q3:
            avg_score = round((progress.self_assessment_q1 + progress.self_assessment_q2 + progress.self_assessment_q3) / 3, 1)
            
            # Determine level label
            if avg_score >= 3.5:
                level_label = "High Confidence"
            elif avg_score >= 2.5:
                level_label = "Steady Progress"
            elif avg_score >= 1.5:
                level_label = "Developing Confidence"
            else:
                level_label = "Emerging Skills"
            
            # Generate captain feedback
            easiest = progress.reflection_easiest or "certain tasks"
            struggle = progress.reflection_struggle or "some challenges"
            improvement = progress.reflection_improvement or "practice more"
            
            captain_feedback = generate_captain_feedback(level_label, easiest, struggle, improvement)
        
        progress_data[progress.unit_id] = {
            "status": status_text,
            "progress": prog_percent,
            "total_attempts": attempts,
            "total_duration": duration,
            "last_attempt": progress.last_attempt.strftime('%Y-%m-%d %H:%M') if progress.last_attempt else "Never",
            "self_assessment": {
                "q1": progress.self_assessment_q1,
                "q2": progress.self_assessment_q2,
                "q3": progress.self_assessment_q3,
                "avg_score": avg_score,
                "level_label": level_label,
            },
            "reflections": {
                "easiest": progress.reflection_easiest or "",
                "struggle": progress.reflection_struggle or "",
                "improvement": progress.reflection_improvement or "",
            },
            "captain_feedback": captain_feedback,
            # NEW: Assessment scores
            "assessment": {
                "task1": progress.assessment_task1_score,
                "task2": progress.assessment_task2_score,
                "task3": progress.assessment_task3_score,
                "total": progress.assessment_total_score,
                "percentage": progress.assessment_percentage
            }
        }

    total_units = len(UNITS)
    overall_progress = int(total_progress_sum / total_units) if total_units > 0 else 0

    default_progress = {
        "status": "Locked", 
        "progress": 0, 
        "total_attempts": 0,
        "total_duration": 0,
        "last_attempt": "Not Yet Started",
        "self_assessment": {"q1": None, "q2": None, "q3": None, "avg_score": None, "level_label": None},
        "reflections": {"easiest": "", "struggle": "", "improvement": ""},
        "captain_feedback": None,
        # NEW
        "assessment": {"task1": None, "task2": None, "task3": None, "total": None, "percentage": None}
    }

    summary_stats = {
        "completed_count": completed_count,
        "total_units": total_units,
        "total_duration": total_duration,
        "total_attempts": total_attempts,
        "overall_progress": overall_progress
    }

    return render_template('report.html', 
                           units_data=UNITS, 
                           progress_data=progress_data,
                           default_progress=default_progress,
                           summary_stats=summary_stats)


def generate_captain_feedback(level, easiest, struggle, improvement):
    """Generate personalized captain feedback based on confidence level."""
    
    if level == "High Confidence":
        return f"""Well done, Cadet. You sailed through this unit with strong confidence. Your skills are steady, your understanding is sharp, and you show that you can navigate these tasks with control. Your reflections also show that you know exactly where you feel solid and what you want to strengthen next. It's great that "{easiest}" felt smooth for you — strong moments like this are anchors for your confidence. And even though dealing with "{struggle}" was challenging, recognizing it the way you did shows maturity and readiness to grow. Your plan to "{improvement}" is a smart and steady move. Keep this course — you're ready for more challenging waters, and I'm confident you'll handle them like a true seafarer."""
    
    elif level == "Steady Progress":
        return f"""Good work, Cadet. You're moving at a steady, reliable pace — just like a vessel keeping a true heading. Your confidence shows growing control of the essentials, and your reflections reveal that you're aware of your strengths and challenges. It's good to see that "{easiest}" felt comfortable for you — that stability builds momentum. As for "{struggle}", your honesty about why it felt difficult shows strong awareness. Your plan to "{improvement}" is a promising step toward smoother sailing. Keep practicing consistently — every attempt builds your skill, and you're on the right path."""
    
    elif level == "Developing Confidence":
        return f"""Cadet, you're building your confidence step by step, and that's exactly how real sailors grow. Your reflections show that you understand what feels tough and how you want to improve — that's the mindset of someone who doesn't give up at sea. It's encouraging that "{easiest}" felt manageable — those small wins matter. And the way you described your challenge with "{struggle}" shows honesty and clarity. Your plan to "{improvement}" is a solid way to strengthen your footing. Stay patient with yourself, keep practicing, and keep showing up — every small effort strengthens your skills."""
    
    else:  # Emerging Skills
        return f"""You're just starting out, Cadet, and that's perfectly okay. Every sailor begins somewhere — even the best captains were once beginners like you. What matters is that you completed this unit and took time to reflect on your learning. It's good that "{easiest}" gave you something to hold onto — small strengths make a difference. And even though "{struggle}" felt difficult, your willingness to name it shows courage. Your plan to "{improvement}" is the right direction forward. Keep your pace steady, focus on one skill at a time, and don't worry about perfection — with each voyage, you'll grow stronger and more confident."""