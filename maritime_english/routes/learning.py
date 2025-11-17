from flask import Blueprint, render_template, redirect, url_for, flash, current_app, abort, flash, request
from flask_login import login_required, current_user
import json
import os
import speech_recognition as speech_recog
from ..models import UnitProgress, UserStats
from ..__init__ import db
from datetime import date

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
        9: 'home', # Part G
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


@learning_bp.route('/report')
@login_required
def report():
    # 1. Ambil data progres YANG SEBENARNYA
    user_progress = UnitProgress.query.filter_by(user_id=current_user.id).all()
    
    # 2. Ubah menjadi dictionary agar mudah diakses di template
    progress_data = {
        progress.unit_id: {
            # Ubah status agar lebih mudah dibaca di laporan
            "status": "Completed" if progress.status == 'completed' else \
                      ("In Progress" if progress.status == 'in_progress' else "Not Yet Started"),
            "progress": progress.progress_percent,
            "score": 0, # Anda perlu menambahkan kolom 'score' di UnitProgress jika ingin ini
            "last_activity": "N/A" # Anda perlu kolom 'last_updated' untuk ini
        } for progress in user_progress
    }

    # 3. Data default untuk unit yang BELUM ada di 'progress_data'
    default_progress = {
        "status": "Locked", "progress": 0, "score": 0, "last_activity": "Not Yet Started"
    }

    return render_template('report.html', 
                           units_data=UNITS, 
                           progress_data=progress_data,
                           default_progress=default_progress)