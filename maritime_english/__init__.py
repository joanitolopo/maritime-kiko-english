import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    db_path = os.path.join(app.instance_path, 'site.db')
    app.config.from_mapping(
        SECRET_KEY='dev',
        SQLALCHEMY_DATABASE_URI=f'sqlite:///{db_path}', 
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    from . import models

    login_manager.init_app(app) 
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(user_id):
        return models.User.query.get(int(user_id))
    
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from .routes.main import main_bp
    app.register_blueprint(main_bp)

    from .routes.learning import learning_bp
    app.register_blueprint(learning_bp)

    with app.app_context():
        db.create_all() 

    return app