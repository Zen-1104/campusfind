from app import app, db, User
from flask_jwt_extended import create_access_token

with app.app_context():
    email = 'syedshahid0711@gmail.com'
    
    # 1. Check if user exists, if not, force create them
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"User not found. Forcing creation of {email}...")
        user = User(name='Syed', email=email, role='admin')
        db.session.add(user)
    else:
        user.role = 'admin'
        
    db.session.commit()
    print(f"🎉 Success! {email} is in the database and is an Admin.")