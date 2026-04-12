from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime, timedelta
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text

app = Flask(__name__)

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# Database Configuration (PostgreSQL for Render, SQLite for Local)
db_uri = os.environ.get('DATABASE_URL', 'sqlite:///campusfind.db')
if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'campusfind-super-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- Database Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(150), unique=True)
    role = db.Column(db.String(20), default='student') # student or admin
    password_hash = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email, 'role': self.role}

class LostItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    location = db.Column(db.String(200))
    date_lost = db.Column(db.String(100))
    contact = db.Column(db.String(100))
    status = db.Column(db.String(50), default='lost')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'category': self.category, 'location': self.location, 'status': self.status,
            'date_lost': self.date_lost, 'contact': self.contact, 'created_at': self.created_at.isoformat()
        }

class FoundItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    location_found = db.Column(db.String(200))
    status = db.Column(db.String(50), default='submitted') # submitted, at_security, collected
    collector_name = db.Column(db.String(100))
    collector_phone = db.Column(db.String(50))
    collector_email = db.Column(db.String(100))
    collector_time = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'category': self.category, 'location': self.location_found, 
            'status': self.status, 'created_at': self.created_at.isoformat(),
            'collector_name': self.collector_name, 'collector_phone': self.collector_phone,
            'collector_email': self.collector_email, 'collector_time': self.collector_time
        }

# Admin credentials
ADMIN_EMAIL = 'syedshahid0711@gmail.com'
ADMIN_PASSWORD_HASH = generate_password_hash('itsshahid07')

with app.app_context():
    db.create_all()
    try:
        db.session.execute(text('ALTER TABLE user ADD COLUMN password_hash VARCHAR(255)'))
        db.session.commit()
    except Exception:
        db.session.rollback()
        
    try:
        db.session.execute(text('ALTER TABLE found_item ADD COLUMN collector_name VARCHAR(100)'))
        db.session.execute(text('ALTER TABLE found_item ADD COLUMN collector_phone VARCHAR(50)'))
        db.session.execute(text('ALTER TABLE found_item ADD COLUMN collector_email VARCHAR(100)'))
    except Exception:
        db.session.rollback()

    try:
        db.session.execute(text('ALTER TABLE found_item ADD COLUMN collector_time VARCHAR(100)'))
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Ensure main admin user exists in the database
    admin_user = User.query.filter_by(email=ADMIN_EMAIL).first()
    if not admin_user:
        admin_user = User(name='Main Admin', email=ADMIN_EMAIL, role='admin', password_hash=ADMIN_PASSWORD_HASH)
        db.session.add(admin_user)
        db.session.commit()
    else:
        admin_user.role = 'admin'
        admin_user.password_hash = ADMIN_PASSWORD_HASH
        db.session.commit()

# --- API Routes ---

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    token = request.json.get('token')
    try:
        # Replace with your actual Google Client ID
        CLIENT_ID = "264145714129-1l9ak5osn77po04ms73kqhi46sl5psi7.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        email = idinfo.get('email', '').lower()

        if email != ADMIN_EMAIL:
            return jsonify({'error': 'Unauthorized. Only the primary administrator can log in via Google.'}), 403
        
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=idinfo.get('name', 'Admin'), email=email, role='admin')
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/admin-login', methods=['POST'])
def admin_login():
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if email != ADMIN_EMAIL:
        return jsonify({'error': 'Unauthorized. Only the primary administrator is permitted.'}), 403

    user = User.query.filter_by(email=email).first()
    if not user or user.role != 'admin' or not user.password_hash:
        return jsonify({'error': 'Invalid credentials. Admin access only.'}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials. Wrong password.'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({'token': access_token, 'user': user.to_dict()}), 200

@app.route('/api/auth/add-admin', methods=['POST'])
@jwt_required()
def add_admin():
    admin_id = get_jwt_identity()
    admin = User.query.get(int(admin_id))
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Unauthorized. Admins only.'}), 403

    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', 'Admin')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists.'}), 400

    new_admin = User(
        name=name,
        email=email,
        role='admin',
        password_hash=generate_password_hash(password)
    )
    db.session.add(new_admin)
    db.session.commit()
    return jsonify({'message': 'Admin created successfully', 'user': new_admin.to_dict()}), 201

@app.route('/api/items/lost', methods=['GET', 'POST'])
@jwt_required(optional=True)
def handle_lost_items():
    if request.method == 'POST':
        user_id = get_jwt_identity()
        if not user_id:
            # Create or fetch a guest user to satisfy the foreign key constraint
            guest = User.query.filter_by(email='guest@campusfind.local').first()
            if not guest:
                guest = User(name='Guest Reporter', email='guest@campusfind.local', role='student')
                db.session.add(guest)
                db.session.commit()
            user_id = guest.id

        data = request.json
        new_item = LostItem(
            user_id=int(user_id),
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            location=data.get('location'),
            date_lost=data.get('date_lost'),
            contact=data.get('contact')
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    
    items = LostItem.query.order_by(LostItem.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200

@app.route('/api/items/found', methods=['GET', 'POST'])
def handle_found_items():
    if request.method == 'POST':
        data = request.json
        new_item = FoundItem(
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            location_found=data.get('location')
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    
    items = FoundItem.query.order_by(FoundItem.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200

# --- Admin Routes ---

@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def get_admin_dashboard():
    admin_id = get_jwt_identity()
    admin = User.query.get(int(admin_id))
    
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Unauthorized. Admin access required.'}), 403

    lost_items = LostItem.query.order_by(LostItem.created_at.desc()).all()
    found_items = FoundItem.query.order_by(FoundItem.created_at.desc()).all()

    return jsonify({
        'lost': [item.to_dict() for item in lost_items],
        'found': [item.to_dict() for item in found_items]
    }), 200

@app.route('/api/admin/verify/<int:item_id>', methods=['POST'])
@jwt_required()
def verify_found_item(item_id):
    item = FoundItem.query.get_or_404(item_id)
    item.status = 'at_security' 
    db.session.commit()
    return jsonify({'message': 'Item verified', 'status': item.status}), 200

@app.route('/api/admin/collect/<int:item_id>', methods=['POST'])
@jwt_required()
def collect_found_item(item_id):
    item = FoundItem.query.get_or_404(item_id)
    item.status = 'collected'
    data = request.json or {}
    item.collector_name = data.get('collector_name')
    item.collector_phone = data.get('collector_phone')
    item.collector_email = data.get('collector_email')
    item.collector_time = data.get('collector_time')
    
    db.session.commit()
    return jsonify({'message': 'Item marked as collected', 'status': item.status}), 200

@app.route('/api/admin/delete/<string:type>/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(type, item_id):
    admin_id = get_jwt_identity()
    admin = User.query.get(int(admin_id))
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    if type == 'lost':
        item = LostItem.query.get_or_404(item_id)
    elif type == 'found':
        item = FoundItem.query.get_or_404(item_id)
    else:
        return jsonify({'error': 'Invalid item type'}), 400

    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': f'Item {item_id} deleted successfully'}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)