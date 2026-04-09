from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///campusfind.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'campusfind-secret-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Create tables on startup
with app.app_context():
    db.create_all()

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
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    location = db.Column(db.String(200))
    date_lost = db.Column(db.String(50))
    contact = db.Column(db.String(200))
    status = db.Column(db.String(50), default='submitted')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'category': self.category, 'location': self.location,
            'date_lost': self.date_lost, 'contact': self.contact,
            'status': self.status, 'created_at': self.created_at.isoformat()
        }

class FoundItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    location_found = db.Column(db.String(200))
    date_found = db.Column(db.String(50))
    contact = db.Column(db.String(200))
    status = db.Column(db.String(50), default='submitted')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'category': self.category, 'location': self.location_found,
            'date_found': self.date_found, 'contact': self.contact,
            'status': self.status
        }

# --- Auth ---
GOOGLE_CLIENT_ID = "84644656189-6q67uk9u76gu3qihn3mu2qhhviho89qd.apps.googleusercontent.com"

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name', 'Student')
        google_id = idinfo['sub']

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email, google_oauth_id=google_id)
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200

    except Exception as e:
        print(f"AUTH ERROR: {str(e)}")
        return jsonify({'error': str(e)}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200

# --- Lost Items ---
@app.route('/api/items/lost', methods=['GET'])
def get_lost_items():
    items = LostItem.query.order_by(LostItem.created_at.desc()).all()
    return jsonify({'items': [i.to_dict() for i in items]}), 200

@app.route('/api/items/lost', methods=['POST'])
@jwt_required()
def report_lost_item():
    data = request.get_json()
    item = LostItem(
        user_id=int(get_jwt_identity()),
        title=data['title'],
        description=data.get('description', ''),
        category=data.get('category', ''),
        location=data.get('location', ''),
        date_lost=data.get('date_lost', ''),
        contact=data.get('contact', '')
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Lost item reported', 'item': item.to_dict()}), 201

# --- Found Items ---
@app.route('/api/items/found', methods=['GET'])
def get_found_items():
    items = FoundItem.query.order_by(FoundItem.created_at.desc()).all()
    return jsonify({'items': [i.to_dict() for i in items]}), 200

@app.route('/api/items/found', methods=['POST'])
def report_found_item():
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            user_id = int(uid)
    except:
        pass
    data = request.get_json()
    item = FoundItem(
        submitted_by=user_id,
        title=data['title'],
        description=data.get('description', ''),
        category=data.get('category', ''),
        location_found=data.get('location', ''),
        date_found=data.get('date_found', ''),
        contact=data.get('contact', '')
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Found item reported', 'item': item.to_dict()}), 201

# --- Status Update (Admin) ---
VALID_STATUSES = ['submitted', 'admin_reviewing', 'ready_for_pickup', 'collected', 'unclaimed']

@app.route('/api/items/<string:item_type>/<int:item_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(item_type, item_id):
    current_user = User.query.get(int(get_jwt_identity()))
    if not current_user or current_user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403
    new_status = request.get_json().get('status')
    if new_status not in VALID_STATUSES:
        return jsonify({'error': 'Invalid status'}), 400
    item = LostItem.query.get(item_id) if item_type == 'lost' else FoundItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    item.status = new_status
    db.session.commit()
    return jsonify({'message': 'Status updated', 'status': new_status}), 200

# --- Admin Dashboard ---
@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    current_user = User.query.get(int(get_jwt_identity()))
    if not current_user or current_user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403
    return jsonify({
        'lost_items': [i.to_dict() for i in LostItem.query.order_by(LostItem.created_at.desc()).all()],
        'found_items': [i.to_dict() for i in FoundItem.query.order_by(FoundItem.created_at.desc()).all()],
    }), 200

# --- Dev Seed ---
@app.route('/api/dev/seed', methods=['POST'])
def seed():
    if User.query.filter_by(email='admin@campus.com').first():
        return jsonify({'message': 'Already seeded'}), 200
    admin = User(name='Campus Admin', email='admin@campus.com', role='admin')
    db.session.add(admin)
    db.session.commit()
    return jsonify({'message': 'Admin created', 'email': 'admin@campus.com'}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=8080, debug=True)