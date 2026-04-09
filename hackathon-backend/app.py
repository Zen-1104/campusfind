from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app, origins="*")

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///campusfind.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'campusfind-secret-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    role = db.Column(db.String(20), default='student')
    google_oauth_id = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email, 'role': self.role}

class LostItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200))
    status = db.Column(db.String(50), default='submitted')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FoundItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    location_found = db.Column(db.String(200))
    status = db.Column(db.String(50), default='submitted')

# --- Auth ---
GOOGLE_CLIENT_ID = "84644656189-6q67uk9u76gu3qihn3mu2qhhviho89qd.apps.googleusercontent.com"

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    token = request.get_json().get('token')
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email, name, google_id = idinfo['email'], idinfo.get('name', 'Student'), idinfo['sub']
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email, google_oauth_id=google_id)
            db.session.add(user)
            db.session.commit()
        return jsonify({'token': create_access_token(identity=str(user.id)), 'user': user.to_dict()}), 200
    except:
        return jsonify({'error': 'Invalid token'}), 401

# --- Items ---
@app.route('/api/items/lost', methods=['POST'])
@jwt_required()
def report_lost_item():
    data = request.get_json()
    item = LostItem(user_id=int(get_jwt_identity()), title=data['title'], location=data['location'])
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Success'}), 201

@app.route('/api/items/found', methods=['POST'])
def report_found_item():
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except: pass
    data = request.get_json()
    item = FoundItem(submitted_by=user_id, title=data['title'], location_found=data['location_found'])
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Success'}), 201

if __name__ == '__main__':
    with app.app_context(): db.create_all()
    app.run(host="0.0.0.0", port=8080)