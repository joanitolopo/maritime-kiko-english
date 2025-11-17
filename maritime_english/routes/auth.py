from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from ..__init__ import db, mail
from ..models import User, UserStats
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_mail import Message

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            flash('Login successful!')
            return redirect(url_for('main.home')) 
        else:
            flash('Invalid email or password.')
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']

        gender = request.form.get('gender')
        school_name = request.form.get('school_name')
        major = request.form.get('major')
        grade = request.form.get('grade')
        
        if User.query.filter_by(username=name).first() or User.query.filter_by(email=email).first():
            flash('Username or email already exists.')
            return redirect(url_for('auth.register'))
        
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(
            username=name, 
            email=email, 
            password=hashed_password,
            gender=gender,
            school_name=school_name,
            major=major,
            grade=grade
        )
        
        new_stats = UserStats(
            user=new_user, # Menghubungkan stats ini ke new_user
            current_unit_name="Spelling the Sea", # Nilai awal
            current_unit_progress=0,
            total_units_completed=0,
            total_learning_time_minutes=0
        )
        db.session.add(new_user)
        db.session.add(new_stats)
        
        db.session.commit()

        flash('Registration successful! Please log in.')
        return redirect(url_for('auth.login'))
    return render_template('register.html')

@auth_bp.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('main.index'))

@auth_bp.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    # Verifikasi token
    s = Serializer(current_app.config['SECRET_KEY'], salt='password-reset-salt')
    try:
        data = s.loads(token, max_age=1800) # Token valid selama 30 menit (1800 detik)
        user_id = data.get('user_id')
    except:
        flash('The password reset link is invalid or has expired.', 'warning')
        return redirect(url_for('auth.login'))

    user = User.query.get(user_id)
    if user is None:
        flash('User not found.', 'warning')
        return redirect(url_for('auth.login'))

    # Jika form disubmit (POST)
    if request.method == 'POST':
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('reset_password.html', token=token)
        
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        user.password = hashed_password
        db.session.commit()
        flash('Your password has been updated! You are now able to log in.', 'success')
        return redirect(url_for('auth.login'))

    # Jika request adalah GET, tampilkan form reset password
    # Anda perlu membuat template 'reset_password.html'
    return render_template('reset_password.html', token=token)

def send_reset_email(user):
    """Membuat token dan mengirim email reset password."""
    s = Serializer(current_app.config['SECRET_KEY'], salt='password-reset-salt')
    token = s.dumps({'user_id': user.id})
    
    msg = Message('Password Reset Request',
                  sender=current_app.config['MAIL_USERNAME'],  # Ganti dengan email pengirim Anda
                  recipients=[user.email])
    
    reset_url = url_for('auth.reset_password', token=token, _external=True)
    
    msg.body = f'''To reset your password, visit the following link:{reset_url}'''

@auth_bp.route('/request_password_reset', methods=['POST'])
def request_password_reset():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        
        if user:
            send_reset_email(user)

        # PENTING: Tampilkan pesan ini baik user-nya ada atau tidak.
        # Ini adalah praktik keamanan untuk mencegah orang menebak email yang terdaftar.
        flash('If an account with that email exists, a password reset link has been sent.', 'info')
        
        # Kembalikan ke halaman login
        return redirect(url_for('auth.login'))
    
    # Jika seseorang mencoba mengakses URL ini dengan GET, redirect saja
    return redirect(url_for('auth.login'))

