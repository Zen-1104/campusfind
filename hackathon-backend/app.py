from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
# Added verify_jwt_in_request to imports to prevent crashes
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime, timedelta
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# --- 1. Infrastructure: PostgreSQL Transition ---
db_uri = os.environ.get('DATABASE_URL', 'sqlite:///campusfind.db')

if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'campusfind-secret-key-123' # Change for production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- 2. Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    role = db.Column(db.String(20), default='student') # student, admin

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
            'date_lost': self.date_lost, 'created_at': self.created_at.isoformat()
        }

class FoundItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    location_found = db.Column(db.String(200))
    # Status Ticker: submitted -> verified -> at_security -> collected
    status = db.Column(db.String(50), default='submitted')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'category': self.category, 'location': self.location_found, 
            'status': self.status, 'created_at': self.created_at.isoformat()
        }

# --- 3. Implementation of Admin Logs ---
# Accountability log to track which admin verified which item
class AdminLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('found_item.id'), nullable=False)
    action = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Sync database tables
with app.app_context():
    db.create_all()

# --- Auth Routes ---

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    token = request.json.get('token')
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
        user = User.query.filter_by(email=idinfo['email']).first()
        if not user:
            user = User(name=idinfo['name'], email=idinfo['email'])
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# --- Item Routes ---

@app.route('/api/items/lost', methods=['GET', 'POST'])
@jwt_required(optional=True)
def handle_lost_items():
    if request.method == 'POST':
        verify_jwt_in_request()
        user_id = get_jwt_identity()
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

# --- Admin Verification Protocol ---

@app.route('/api/admin/verify/<int:item_id>', methods=['POST'])
@jwt_required()
def verify_found_item(item_id):
    admin_id = get_jwt_identity()
    admin = User.query.get(int(admin_id))
    
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Unauthorized. Admin access required.'}), 403

    item = FoundItem.query.get_or_404(item_id)
    item.status = 'at_security' 
    
    # Log the action for accountability
    log = AdminLog(admin_id=admin.id, item_id=item.id, action="Verified and stored at security")
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'message': 'Item verified successfully', 'status': item.status}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)