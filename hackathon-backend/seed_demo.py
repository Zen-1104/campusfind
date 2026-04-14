from app import db, app, FoundItem

demo_items = [
    {
        "title": "BMW Race Car Key Chain",
        "description": "A black BMW branded key chain with a race car logo. Found near the parking lot.",
        "category": "Accessories",
        "location_found": "A-Block",
        "reporter_phone": "9876543210",
    },
    {
        "title": "Sony Headphones",
        "description": "Black Sony over-ear headphones in good condition. Found in the library.",
        "category": "Electronics",
        "location_found": "B-Block",
        "reporter_phone": "9876543210",
    },
    {
        "title": "Blue Water Bottle",
        "description": "Blue Nalgene plastic water bottle with stickers. Found near canteen.",
        "category": "Accessories",
        "location_found": "C-Block",
        "reporter_phone": "9876543210",
    },
    {
        "title": "Red Wallet",
        "description": "Small red leather wallet, no cash but has some cards inside.",
        "category": "Wallets/Keys",
        "location_found": "D-Block",
        "reporter_phone": "9876543210",
    },
    {
        "title": "iPhone 14 Pro",
        "description": "Black Apple iPhone 14 Pro with cracked screen protector. Found in the lab.",
        "category": "Electronics",
        "location_found": "G-Block",
        "reporter_phone": "9876543210",
    },
    {
        "title": "Laptop Charger",
        "description": "Dell laptop charger, 65W, white with USB-C connector.",
        "category": "Electronics",
        "location_found": "F-Block",
        "reporter_phone": "9876543210",
    },
    {
        "title": "Student ID Card",
        "description": "Student ID card belonging to Rahul, found near the main gate.",
        "category": "Others",
        "location_found": "Law-Block",
        "reporter_phone": "9876543210",
    },
]

with app.app_context():
    added = 0
    for item_data in demo_items:
        # Check if similar title already exists
        exists = FoundItem.query.filter(FoundItem.title.ilike(f"%{item_data['title'].split()[0]}%")).first()
        if not exists:
            new_item = FoundItem(**item_data)
            db.session.add(new_item)
            added += 1
            print(f"  Added: {item_data['title']}")
        else:
            print(f"  Skip (exists): {item_data['title']}")
    db.session.commit()
    print(f"\nDone! Added {added} new items. Total: {FoundItem.query.count()}")
