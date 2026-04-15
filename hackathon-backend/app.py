from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime, timedelta
import os
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from werkzeug.utils import secure_filename
from sqlalchemy import text
from google import genai as google_genai
from google.genai import types as genai_types
 
# Initialize new Gemini client with short HTTP timeout to fail fast on quota errors
gemini_client = google_genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyB0gopOQoBlcI18hj8sAd-fCtMeqx8M7MA"),
    http_options=genai_types.HttpOptions(timeout=8000)
)

app = Flask(__name__)

# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Enable CORS
CORS(app, resources={r"/api/*": { "origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"] }})


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
    photo_filename = db.Column(db.String(300), nullable=True)
    reporter_phone = db.Column(db.String(20), nullable=True)  # Phone of the person who reported
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Public serialization — hides reporter_phone"""
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'category': self.category, 'location': self.location_found,
            'status': self.status, 'created_at': self.created_at.isoformat(),
            'collector_name': self.collector_name, 'collector_phone': self.collector_phone,
            'collector_email': self.collector_email, 'collector_time': self.collector_time,
            'photo_url': f"/api/uploads/{self.photo_filename}" if self.photo_filename else None
        }

    def to_dict_admin(self):
        """Admin serialization — includes reporter_phone"""
        data = self.to_dict()
        data['reporter_phone'] = self.reporter_phone
        return data

# Database setup and schema updates
with app.app_context():
    db.create_all()
    
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

    try:
        db.session.execute(text('ALTER TABLE found_item ADD COLUMN photo_filename VARCHAR(300)'))
        db.session.commit()
    except Exception:
        db.session.rollback()

    try:
        db.session.execute(text('ALTER TABLE found_item ADD COLUMN reporter_phone VARCHAR(20)'))
        db.session.commit()
    except Exception:
        db.session.rollback()

# --- API Routes ---

# Define allowed domain and admins
ALLOWED_DOMAIN = '@karnavatiuniversity.edu.in'
ADMIN_EMAILS = [
    'ku2507u0198@karnavatiuniversity.edu.in', # Primary admin
    'ku2507u0041@karnavatiuniversity.edu.in'
]

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    body = request.get_json(silent=True) or {}
    token = body.get('token')

    if not token:
        return jsonify({'error': 'No token provided'}), 400

    try:
        CLIENT_ID = "264145714129-1l9ak5osn77po04ms73kqhi46sl5psi7.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        email = idinfo.get('email', '').lower()

        is_admin = email in ADMIN_EMAILS
        is_student = email.endswith(ALLOWED_DOMAIN)

        if not (is_admin or is_student):
            return jsonify({'error': f'Unauthorized. Only {ALLOWED_DOMAIN} emails or registered admins are permitted.'}), 403

        user = User.query.filter_by(email=email).first()
        if not user:
            role = 'admin' if is_admin else 'student'
            user = User(name=idinfo.get('name', 'User'), email=email, role=role)
            db.session.add(user)
            db.session.commit()
        else:
            expected_role = 'admin' if is_admin else 'student'
            if user.role != expected_role:
                user.role = expected_role
                db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid Google token: {str(e)}'}), 401
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 400

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
        # Support both multipart/form-data (with photo) and application/json
        data = {}
        if request.content_type:
            if 'multipart/form-data' in request.content_type:
                data = request.form
            elif 'application/json' in request.content_type:
                data = request.get_json(silent=True) or {}
            else:
                data = request.form
        else:
            data = request.get_json(silent=True) or {}

        photo_filename = None
        if 'photo' in request.files:
            photo = request.files['photo']
            if photo and photo.filename and allowed_file(photo.filename):
                ext = photo.filename.rsplit('.', 1)[1].lower()
                unique_name = f"{uuid.uuid4().hex}.{ext}"
                photo.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_name))
                photo_filename = unique_name

        new_item = FoundItem(
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            location_found=data.get('location'),
            photo_filename=photo_filename,
            reporter_phone=data.get('reporter_phone')
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201

    # Public GET — photo_url included for everyone
    items = FoundItem.query.order_by(FoundItem.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200

# ── Helper: compare two images directly with Gemini ──────────────────────────
def gemini_compare_images(user_img_bytes, item_photo_path, user_mime='image/jpeg'):
    """Ask Gemini to rate visual similarity between two images. Returns 0-100."""
    try:
        if not os.path.exists(item_photo_path):
            return -1  # Can't compare
        with open(item_photo_path, 'rb') as f:
            item_bytes = f.read()
        ext = item_photo_path.rsplit('.', 1)[-1].lower()
        item_mime = {'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png',
                     'gif':'image/gif','webp':'image/webp'}.get(ext, 'image/jpeg')
        prompt = (
            "You are comparing two images to check if they show the same lost item.\n"
            "Image 1 is uploaded by a person who LOST an item.\n"
            "Image 2 is a photo of a FOUND item in a campus lost-and-found system.\n"
            "Rate the visual similarity of the objects in both images on a scale from 0 to 100:\n"
            "  100 = same object (same color, brand, type)\n"
            "  70+ = very likely the same type of item\n"
            "  40-69 = similar category but different\n"
            "  0-39 = completely different objects\n"
            "Reply with ONLY the number (e.g. 85). No other text."
        )
        resp = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                genai_types.Part.from_bytes(data=user_img_bytes, mime_type=user_mime),
                genai_types.Part.from_bytes(data=item_bytes, mime_type=item_mime),
                prompt
            ]
        )
        if resp and resp.text:
            import re as _re
            m = _re.search(r'\d+', resp.text.strip())
            score = int(m.group()) if m else 50
            return min(100, max(0, score))
    except Exception as ce:
        print(f"[Compare] Error: {str(ce)[:80]}")
    return -1  # Failed to compare

# --- AI Scanner Route ---
@app.route('/api/scan_item', methods=['POST'])
def scan_item():
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo uploaded'}), 400
    photo = request.files['photo']
    if not photo or photo.filename == '':
        return jsonify({'error': 'Empty file'}), 400

    import os
    
    img_bytes = photo.read()
    ext       = (photo.filename.rsplit('.', 1)[-1].lower()) if photo.filename else 'jpg'
    mime_map  = {'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png',
                 'gif':'image/gif','webp':'image/webp'}
    user_mime = mime_map.get(ext, 'image/jpeg')

    # ═══════════════════════════════════════════════════════════════════════════
    # DIRECT AI IMAGE MATCHING
    # Fetch latest 20 items from Database that ACTUALLY have a photo
    # ═══════════════════════════════════════════════════════════════════════════
    candidates = FoundItem.query.filter(FoundItem.photo_filename != None).order_by(FoundItem.created_at.desc()).limit(20).all()
    UPLOAD_DIR = app.config['UPLOAD_FOLDER']

    items_with_score = []
    
    try:
        # Loop over candidates and perform direct Image-to-Image AI comparison
        for item in candidates:
            photo_path = os.path.join(UPLOAD_DIR, item.photo_filename)
            score = gemini_compare_images(img_bytes, photo_path, user_mime)
            print(f"[Direct AI Scan] '{item.title}' -> score={score}")
            
            # ONLY return items if AI strongly confirms they visually look like a match (70%+)
            if score >= 70:
                items_with_score.append((score, item))
                
        # Sort by similarity score descending (Best matches first)
        items_with_score.sort(key=lambda x: x[0], reverse=True)
        final_matches = [item for score, item in items_with_score]
        score_map = {item.id: score for score, item in items_with_score}

        # Build response with similarity scores attached
        matches_out = []
        for item in final_matches[:12]:
            d = item.to_dict()
            d['similarity_score'] = score_map.get(item.id, 0)
            matches_out.append(d)

        return jsonify({
            'keywords'         : [],
            'ai_description'   : '',
            'matches'          : matches_out,
            'ai_used'          : True,
            'scan_method'      : 'direct_ai',
            'show_all_fallback': False
        }), 200

    except Exception as e:
        print(f"[Direct AI Scan Error] {str(e)}")
        # Note: If the Gemini API key crashes, it gracefully returns nothing rather than dumping all items
        return jsonify({'error': 'Direct AI visual match failed', 'message': str(e)}), 500


# Public image serving — anyone can view uploaded item photos
@app.route('/api/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

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
        'found': [item.to_dict_admin() for item in found_items]
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