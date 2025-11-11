from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
import os

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    return render_template('index.html')

@main_bp.route('/home')
@login_required
def home():
    units = [
        {"id": 1, "title": "Basic Maritime Vocabulary"},
        {"id": 2, "title": "Ship Anatomy and Equipment"},
        {"id": 3, "title": "Navigation Terms"},
        {"id": 4, "title": "Safety and Emergency Phrases"},
        {"id": 5, "title": "Radio Communication"},
        {"id": 6, "title": "Maritime Commands and Instructions"}
    ]
    return render_template('home.html', units=units)

@main_bp.route('/profile')
@login_required
def profile():
    # Data tiruan (Mockup) untuk field yang mungkin belum ada di database User Anda
    # Nanti Anda bisa ganti ini dengan data asli dari current_user
    user_info = {
        "school": "Maritime Academy",
        "major": "Nautical Studies",
        "grade": "Cadet Class 1",
        "joined_date": "1 November 2025"
    }
    return render_template('profile.html', user_info=user_info)