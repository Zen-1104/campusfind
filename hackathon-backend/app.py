from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# --- Technical Infrastructure Update: PostgreSQL Transition ---
# This checks for a DATABASE_URL environment variable (PostgreSQL) 
# and falls back to local SQLite if not found.
db_uri = os.environ.get('DATABASE_URL', 'sqlite:///campusfind.db')
if db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'campusfind-secret-change-in-production'

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- Updated Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    role = db.Column(db.String(20), default='student') # Roles: student, admin

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email, 'role': self.role}

class FoundItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    location_found = db.Column(db.String(200))
    # Status ticker states: submitted, verified, at_security, collected
    status = db.Column(db.String(50), default='submitted') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 
            'title': self.title, 
            'location': self.location_found, 
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

# --- 2. Implementation of Admin Logs ---
# This model ensures accountability by tracking which admin processed which item.
class AdminLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('found_item.id'), nullable=False)
    action = db.Column(db.String(100)) # e.g., "Verified at Desk", "Marked as Collected"
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'item_id': self.item_id,
            'action': self.action,
            'timestamp': self.timestamp.isoformat()
        }

# Helper to log admin actions
def log_admin_action(admin_id, item_id, action):
    log = AdminLog(admin_id=admin_id, item_id=item_id, action=action)
    db.session.add(log)
    db.session.commit()

# --- Verification Logic Example ---
@app.route('/api/admin/verify/<int:item_id>', methods=['POST'])
@jwt_required()
def verify_item(item_id):
    admin_id = int(get_jwt_identity())
    admin_user = User.query.get(admin_id)
    
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'error': 'Unauthorized. Admin role required.'}), 403

    item = FoundItem.query.get_or_404(item_id)
    item.status = 'verified'
    
    log_admin_action(admin_id, item_id, "Verified item at security desk")
    
    db.session.commit()
    return jsonify({'message': 'Item verified and logged', 'status': item.status}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))