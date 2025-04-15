from flask import Flask
from app.config import DEBUG, SECRET_KEY

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config['DEBUG'] = DEBUG
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Register blueprints
    from app.routes import files, chat
    app.register_blueprint(files.bp)
    app.register_blueprint(chat.bp)
    
    return app 