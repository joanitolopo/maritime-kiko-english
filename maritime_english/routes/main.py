from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
import os
from datetime import datetime
import requests
from flask import request, jsonify
from ..__init__ import db

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
    # Ambil data user yang sedang login
    user = current_user
    
    # Format joined date (asumsi ada kolom created_at di User model)
    # Jika belum ada, tambahkan di model atau gunakan default
    joined_date = "January 2025"  # Default jika tidak ada timestamp
    
    # Jika Anda memiliki kolom created_at di User model:
    # if hasattr(user, 'created_at') and user.created_at:
    #     joined_date = user.created_at.strftime('%B %Y')
    
    # Buat dictionary untuk user info
    user_info = {
        "school": user.school_name if user.school_name else "Not specified",
        "major": user.major if user.major else "Not specified", 
        "grade": user.grade if user.grade else "Not specified",
        "gender": user.gender if user.gender else "Not specified",
        "joined_date": joined_date
    }
    
    return render_template('profile.html', 
                           user_info=user_info)

from werkzeug.security import check_password_hash, generate_password_hash

@main_bp.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "No data received"}), 400
    
    try:
        user = current_user
        
        # Update fields
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'gender' in data:
            user.gender = data['gender']
        if 'school_name' in data:
            user.school_name = data['school_name']
        if 'major' in data:
            user.major = data['major']
        if 'grade' in data:
            user.grade = data['grade']
        
        db.session.commit()
        return jsonify({"success": True, "message": "Profile updated successfully!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@main_bp.route('/change_password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "No data received"}), 400
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"success": False, "message": "All fields are required"}), 400
    
    # Verify current password
    if not check_password_hash(current_user.password, current_password):
        return jsonify({"success": False, "message": "Current password is incorrect"}), 400
    
    try:
        current_user.password = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({"success": True, "message": "Password changed successfully!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500