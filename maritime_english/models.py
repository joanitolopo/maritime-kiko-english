from .__init__ import db
from flask_login import UserMixin

# Model User Anda yang sudah ada
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    gender = db.Column(db.String(10), nullable=True) # "Male", "Female"
    school_name = db.Column(db.String(100), nullable=True)
    major = db.Column(db.String(100), nullable=True) # Misal: "Science", "Social", "Maritime"
    grade = db.Column(db.String(10), nullable=True) # Misal: "X", "XI", "XII"
    
    stats = db.relationship('UserStats', back_populates='user', uselist=False, cascade="all, delete-orphan")
    unit_progress = db.relationship('UnitProgress', back_populates='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.id}>'

# MODEL BARU UNTUK STATISTIK
class UserStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Data yang akan kita lacak
    current_unit_name = db.Column(db.String(100), default="Spelling the Sea")
    current_unit_progress = db.Column(db.Integer, default=0) # Disimpan sebagai persen (misal: 25)
    total_units_completed = db.Column(db.Integer, default=0)
    total_learning_time_minutes = db.Column(db.Integer, default=0) # Disimpan dalam menit

    minutes_today = db.Column(db.Integer, default=0) # Untuk melacak '+15m today'
    last_active_date = db.Column(db.Date, default=None, nullable=True) # Untuk tahu kapan 'today' itu

    # Kunci Asing (Foreign Key) untuk terhubung ke User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    # Tambahkan relasi balik ini:
    user = db.relationship('User', back_populates='stats')

    def __repr__(self):
        return f'<UserStats for User {self.user_id}>'
    
class UnitProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Kunci Asing (Foreign Key)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    unit_id = db.Column(db.Integer, nullable=False)
    
    # Ini adalah data yang kita lacak:
    
    # 1. 'completed_subunits' (Misal: 1, 2, 3... dari 9)
    # Ini adalah angka yang kita kirim ke modal popup
    completed_subunits = db.Column(db.Integer, default=0) 
    
    # 2. 'progress_percent' (Misal: 11, 22, 33... dari 100)
    # Ini untuk progress bar di kartu unit
    progress_percent = db.Column(db.Integer, default=0) 
    
    # 3. 'status' (Misal: 'not_started', 'in_progress', 'completed')
    # Ini untuk menentukan status kartu (locked, active, in-progress)
    status = db.Column(db.String(20), default='not_started') 

    # === KOLOM BARU ===
    total_attempts = db.Column(db.Integer, default=0)  # Berapa kali user mencoba unit ini
    total_duration_minutes = db.Column(db.Integer, default=0)  # Total waktu di unit ini (menit)
    last_attempt = db.Column(db.DateTime, default=None, nullable=True)  # Kapan terakhir kali akses
    
    # Self-assessment scores (untuk Unit 1, mungkin unit lain juga)
    self_assessment_q1 = db.Column(db.Integer, nullable=True)  # Skor 1-4
    self_assessment_q2 = db.Column(db.Integer, nullable=True)
    self_assessment_q3 = db.Column(db.Integer, nullable=True)
    
    # Reflection notes
    reflection_easiest = db.Column(db.Text, nullable=True)
    reflection_struggle = db.Column(db.Text, nullable=True)
    reflection_improvement = db.Column(db.Text, nullable=True)
    # === AKHIR KOLOM BARU ===

    # Assessment scores from Activity 9 (guided_task_1)
    assessment_task1_score = db.Column(db.Integer, nullable=True)  # Vessel Names (0-5)
    assessment_task2_score = db.Column(db.Integer, nullable=True)  # Call Sign Input (0-5)
    assessment_task3_score = db.Column(db.Integer, nullable=True)  # Call Sign Speech (0-5)
    assessment_total_score = db.Column(db.Integer, nullable=True)  # Total (0-15)
    assessment_percentage = db.Column(db.Float, nullable=True)      # Percentage (0-100)

    # Relasi kembali ke User
    user = db.relationship('User', back_populates='unit_progress')

    # Membuat unik: Setiap user hanya boleh punya SATU entri per unit_id
    __table_args__ = (db.UniqueConstraint('user_id', 'unit_id', name='_user_unit_uc'),)

    def __repr__(self):
        return f'<UnitProgress User {self.user_id}, Unit {self.unit_id}: {self.completed_subunits} subunits>'