from app import db, app, FoundItem
from sqlalchemy import or_

with app.app_context():
    items = FoundItem.query.all()
    print("ALL ITEMS IN DB:")
    for item in items:
        print(f"- {item.title} | {item.description}")
        
    keywords_text = "Sports car, Blue, BMW."
    import re
    # Remove all punctuation except commas and spaces
    clean_text = re.sub(r'[^\w\s,]', '', keywords_text)
    
    # Split by comma, then split by spaces to get granular words
    raw_keywords = [k.strip() for k in clean_text.split(',') if k.strip()]
    granular_keywords = []
    for kw in raw_keywords:
        granular_keywords.extend(kw.split())
        
    # Remove short words (like 'a', 'an') and make unique
    keywords = list(set([k for k in granular_keywords if len(k) > 2]))
    print(f"\nExtracted Keywords: {keywords}")

    conditions = []
    for kw in keywords:
        conditions.append(FoundItem.title.ilike(f'%{kw}%'))
        conditions.append(FoundItem.description.ilike(f'%{kw}%'))
        conditions.append(FoundItem.category.ilike(f'%{kw}%'))
        
    matched_items = FoundItem.query.filter(or_(*conditions)).order_by(FoundItem.created_at.desc()).limit(10).all()
    print(f"\nMATCHED ITEMS ({len(matched_items)}):")
    for item in matched_items:
        print(f"- {item.id}: {item.title}")
