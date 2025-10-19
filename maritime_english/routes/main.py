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