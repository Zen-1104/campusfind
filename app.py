from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os

app = Flask(__name__)

CORS(app, origins="*")

# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///campusfind.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'campusfind-secret-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Upload config
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

db  = SQLAlchemy(app)
jwt = JWTManager(app)

# ================= MODELS =================

class User(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(150), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role          = db.Column(db.String(20), default='student')
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email, 'role': self.role}


class LostItem(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    category    = db.Column(db.String(100))
    description = db.Column(db.Text)
    location    = db.Column(db.String(200))
    date_lost   = db.Column(db.String(50))
    contact     = db.Column(db.String(200))
    status      = db.Column(db.String(50), default='submitted')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='lost_items')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'category': self.category,
            'description': self.description,
            'location': self.location,
            'date_lost': self.date_lost,
            'contact': self.contact,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
        }


class FoundItem(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title        = db.Column(db.String(200), nullable=False)
    category     = db.Column(db.String(100))
    description  = db.Column(db.Text)
    location     = db.Column(db.String(200))
    date_found   = db.Column(db.String(50))
    status       = db.Column(db.String(50), default='submitted')
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'submitted_by': self.submitted_by,
            'title': self.title,
            'category': self.category,
            'description': self.description,
            'location': self.location,
            'date_found': self.date_found,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
        }


# ================= AUTH ROUTES =================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Name, email, and password required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(name=data['name'], email=data['email'])
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user = User.query.get(int(get_jwt_identity()))
    return jsonify({'user': user.to_dict()}), 200


# ================= LOST ITEMS =================

@app.route('/api/items/lost', methods=['GET'])
def get_lost_items():
    items = LostItem.query.order_by(LostItem.created_at.desc()).all()
    return jsonify({'items': [i.to_dict() for i in items]}), 200


@app.route('/api/items/lost', methods=['POST'])
@jwt_required()
def report_lost_item():
    data = request.get_json()

    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    item = LostItem(
        user_id=int(get_jwt_identity()),
        title=data['title'],
        category=data.get('category', ''),
        description=data.get('description', ''),
        location=data.get('location', ''),
        date_lost=data.get('date_lost', ''),
        contact=data.get('contact', ''),
    )

    db.session.add(item)
    db.session.commit()

    return jsonify({'message': 'Lost item reported', 'item': item.to_dict()}), 201


# ================= FOUND ITEMS =================

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

    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    item = FoundItem(
        submitted_by=user_id,
        title=data['title'],
        category=data.get('category', ''),
        description=data.get('description', ''),
        location=data.get('location', ''),
        date_found=data.get('date_found', ''),
    )

    db.session.add(item)
    db.session.commit()

    return jsonify({'message': 'Found item reported', 'item': item.to_dict()}), 201


# ================= ADMIN =================

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

    item = LostItem.query.get_or_404(item_id) if item_type == 'lost' else FoundItem.query.get_or_404(item_id)

    item.status = new_status
    db.session.commit()

    return jsonify({'message': 'Status updated'}), 200


@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    current_user = User.query.get(int(get_jwt_identity()))

    if not current_user or current_user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    return jsonify({
        'lost_items': [i.to_dict() for i in LostItem.query.all()],
        'found_items': [i.to_dict() for i in FoundItem.query.all()],
    })


# ================= UPLOADS =================

@app.route('/api/items/<string:item_type>/<int:item_id>/photos', methods=['POST'])
@jwt_required()
def upload_photo(item_type, item_id):
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo provided'}), 400

    file = request.files['photo']

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    filename = secure_filename(f"{item_type}_{item_id}_{datetime.utcnow().timestamp()}_{file.filename}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    file.save(filepath)

    return jsonify({'photo_url': f'/uploads/{filename}'}), 201


@app.route('/uploads/<path:filename>')
@jwt_required()
def get_photo(filename):
    current_user = User.query.get(int(get_jwt_identity()))

    if not current_user or current_user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ================= DEV =================

@app.route('/api/dev/seed', methods=['POST'])
def seed():
    if User.query.filter_by(email='admin@campus.com').first():
        return jsonify({'message': 'Already seeded'})

    admin = User(name='Admin', email='admin@campus.com', role='admin')
    admin.set_password('admin123')

    db.session.add(admin)
    db.session.commit()

    return jsonify({'email': 'admin@campus.com', 'password': 'admin123'})


# ================= RUN =================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)