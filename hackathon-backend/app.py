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
    api_key=os.environ.get("GEMINI_API_KEY", ""),
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
CORS(app, resources={r"/api/*": { "origins": [ "http://localhost:5173", "http://localhost:3000", os.environ.get("FRONTEND_URL", "*") ], "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"] }})


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
ALLOWED_DOMAIN = '@karnavatiuniversity.edu.in' # <-- Replace with your actual university domain!
ADMIN_EMAILS = [
    'ku2507u0198@karnavatiuniversity.edu.in', # Primary admin
    # Add more admin emails here:
    # 'john.doe@college.edu',
    # 'admin@college.edu'
]

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    token = request.json.get('token')
    try:
        # Replace with your actual Google Client ID
        CLIENT_ID = "264145714129-1l9ak5osn77po04ms73kqhi46sl5psi7.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        email = idinfo.get('email', '').lower()

        # Check if user is allowed to log in
        is_admin = email in ADMIN_EMAILS
        is_student = email.endswith(ALLOWED_DOMAIN)

        if not (is_admin or is_student):
            return jsonify({'error': f'Unauthorized. Only {ALLOWED_DOMAIN} emails or registered admins are permitted.'}), 403
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # Determine role based on which list/condition they matched
            role = 'admin' if is_admin else 'student'
            user = User(name=idinfo.get('name', 'User'), email=email, role=role)
            db.session.add(user)
            db.session.commit()
        else:
            # Ensure their role is up-to-date in case they were added to the admin list later
            expected_role = 'admin' if is_admin else 'student'
            if user.role != expected_role:
                user.role = expected_role
                db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

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

    import re, io
    from sqlalchemy import or_
    from PIL import Image as PILImage

    description_hint = request.form.get('description', '').strip()
    img_bytes = photo.read()
    ext       = (photo.filename.rsplit('.', 1)[-1].lower()) if photo.filename else 'jpg'
    mime_map  = {'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png',
                 'gif':'image/gif','webp':'image/webp'}
    user_mime = mime_map.get(ext, 'image/jpeg')

    used_ai       = False
    scan_method   = 'color'
    ai_description = ''
    raw_keywords  = []

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 1 — Rich AI description of the uploaded image
    # (10–15 descriptors: object type, colors, brand, material, unique features)
    # ═══════════════════════════════════════════════════════════════════════════
    rich_prompt = (
        "Analyze this image carefully and identify the main object.\n"
        "Output ONLY a comma-separated list of 10 to 15 descriptive words/phrases that cover:\n"
        "- The specific object type (e.g. wallet, headphones, phone, bottle, keychain, charger, id card)\n"
        "- ALL colors visible (specific: 'navy blue', 'matte black', 'silver')\n"
        "- Brand name or logo if visible (e.g. Sony, Apple, BMW, Samsung, Nike, Dell)\n"
        "- Material (e.g. leather, plastic, metal, fabric, glass)\n"
        "- Any unique features (e.g. cracked screen, stickers, wrist strap, USB-C)\n"
        "Example output: headphones, black, Sony, over-ear, plastic, wireless, MDR series\n"
        "ONLY output the comma-separated descriptors. Nothing else."
    )

    for model_name in ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']:
        try:
            resp = gemini_client.models.generate_content(
                model=model_name,
                contents=[genai_types.Part.from_bytes(data=img_bytes, mime_type=user_mime), rich_prompt]
            )
            if resp and resp.text and len(resp.text.strip()) > 3:
                ai_description = resp.text.replace('\n', '').strip()
                clean = re.sub(r'[^\w\s,]', '', ai_description)
                raw_keywords = [k.strip() for k in clean.split(',') if k.strip()]
                used_ai     = True
                scan_method = 'ai'
                print(f"[AI-Phase1] {model_name}: {raw_keywords}")
                break
        except Exception as me:
            print(f"[AI-Phase1] {model_name} failed: {str(me)[:80]}")

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 2 — Fallback: Pillow color + description hint (if AI unavailable)
    # ═══════════════════════════════════════════════════════════════════════════
    if not raw_keywords:
        try:
            img = PILImage.open(io.BytesIO(img_bytes)).convert('RGB').resize((80, 80))
            pix = list(img.getdata())
            r = sum(p[0] for p in pix) // len(pix)
            g = sum(p[1] for p in pix) // len(pix)
            b = sum(p[2] for p in pix) // len(pix)
            bri = (r + g + b) / 3
            if   bri < 60:                  color = 'black'
            elif bri > 200:                 color = 'white'
            elif r > g and r > b and r > 160: color = 'red'
            elif r > g and r > b:           color = 'brown'
            elif g > r and g > b:           color = 'green'
            elif b > r and b > g:           color = 'blue'
            elif r > 150 and g > 150:       color = 'yellow'
            elif r > 130 and g > 80 and b < 80: color = 'orange'
            else:                           color = 'grey'
            raw_keywords = [color]
            print(f"[Color] dominant={color}")
        except Exception as ce:
            print(f"[Color] failed: {ce}")

    # Blend in user-typed description hint
    if description_hint:
        hint_words = [w.strip() for w in re.split(r'[,\s]+', description_hint) if len(w.strip()) >= 2]
        raw_keywords = list(set(raw_keywords + hint_words))
        if not used_ai:
            scan_method = 'description'

    print(f"[Search] method={scan_method} | keywords={raw_keywords}")

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 3 — Broad DB keyword search to get candidates for image comparison
    # ═══════════════════════════════════════════════════════════════════════════
    all_tokens = set()
    for kw in raw_keywords:
        kw = kw.strip()
        if len(kw) >= 2:
            all_tokens.add(kw.lower())
        for w in re.split(r'\s+', kw):
            w = w.strip()
            if len(w) >= 2:
                all_tokens.add(w.lower())
            if len(w) >= 6:
                all_tokens.add(w[:4].lower())
                all_tokens.add(w[:5].lower())

    conditions = []
    for tok in all_tokens:
        if len(tok) >= 2:
            conditions.append(FoundItem.title.ilike(f'%{tok}%'))
            conditions.append(FoundItem.description.ilike(f'%{tok}%'))
            conditions.append(FoundItem.category.ilike(f'%{tok}%'))
            conditions.append(FoundItem.location_found.ilike(f'%{tok}%'))

    if conditions:
        candidates = (FoundItem.query.filter(or_(*conditions))
                      .order_by(FoundItem.created_at.desc()).limit(20).all())
    else:
        # No keywords at all — scan ALL items visually
        candidates = FoundItem.query.order_by(FoundItem.created_at.desc()).limit(20).all()

    # Deduplicate
    seen_ids, candidates = set(), [c for c in candidates if not (c.id in seen_ids or seen_ids.add(c.id))]

    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 4 — Direct image-to-image visual comparison (Gemini) for each candidate
    # This is the HIGH-ACCURACY step — replaces keyword guessing with visual matching
    # ═══════════════════════════════════════════════════════════════════════════
    scored_results = []
    items_with_score = []
    items_without_photo = []

    if used_ai:  # Only do image comparison when AI is working
        UPLOAD_DIR = app.config['UPLOAD_FOLDER']
        for item in candidates:
            if item.photo_filename:
                photo_path = os.path.join(UPLOAD_DIR, item.photo_filename)
                score = gemini_compare_images(img_bytes, photo_path, user_mime)
                print(f"[Compare] '{item.title}' → score={score}")
                if score >= 0:
                    items_with_score.append((score, item))
                else:
                    items_without_photo.append(item)
            else:
                items_without_photo.append(item)

        # Sort by similarity score, keep items ≥ 35 similarity
        items_with_score.sort(key=lambda x: x[0], reverse=True)
        matched_by_visual = [item for score, item in items_with_score if score >= 35]

        # Blend: visually matched first, then keyword-only (no photo) items
        final_matches = matched_by_visual + items_without_photo

        # If visual comparison found strong matches, restrict to those only
        strong_visual = [item for score, item in items_with_score if score >= 60]
        if strong_visual:
            final_matches = strong_visual + [item for score, item in items_with_score if 35 <= score < 60]

        # Add similarity scores to response
        score_map = {item.id: score for score, item in items_with_score}
    else:
        # No AI — just return keyword candidates as-is
        final_matches = candidates
        score_map = {}

    # ── Final fallback: if nothing found at all, show everything ─────────────
    show_all = False
    if not final_matches:
        final_matches = FoundItem.query.order_by(FoundItem.created_at.desc()).limit(15).all()
        show_all = True
        print("[Fallback] No matches — returning all items")

    # Build response with similarity scores attached
    matches_out = []
    for item in final_matches[:12]:
        d = item.to_dict()
        if item.id in score_map:
            d['similarity_score'] = score_map[item.id]
        matches_out.append(d)

    return jsonify({
        'keywords'         : raw_keywords,
        'ai_description'   : ai_description,
        'matches'          : matches_out,
        'ai_used'          : used_ai,
        'scan_method'      : scan_method,
        'show_all_fallback': show_all
    }), 200


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