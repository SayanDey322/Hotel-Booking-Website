import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
import bcrypt
import uuid

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_data():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear existing data
    await db.users.delete_many({})
    await db.hotels.delete_many({})
    await db.rooms.delete_many({})
    await db.bookings.delete_many({})
    await db.payment_transactions.delete_many({})
    
    print("Cleared existing data")
    
    # Create admin user
    admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    admin_user = {
        'id': str(uuid.uuid4()),
        'email': 'admin@luxestay.com',
        'password': admin_password,
        'name': 'Admin User',
        'phone': '+1234567890',
        'role': 'admin',
        'created_at': '2025-01-01T00:00:00+00:00'
    }
    await db.users.insert_one(admin_user)
    print(f"Created admin user: admin@luxestay.com / admin123")
    
    # Create regular user
    user_password = bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    regular_user = {
        'id': str(uuid.uuid4()),
        'email': 'user@example.com',
        'password': user_password,
        'name': 'John Doe',
        'phone': '+1987654321',
        'role': 'user',
        'created_at': '2025-01-01T00:00:00+00:00'
    }
    await db.users.insert_one(regular_user)
    print(f"Created regular user: user@example.com / user123")
    
    # Create hotels
    hotels_data = [
        {
            'id': str(uuid.uuid4()),
            'name': 'The Grand Plaza',
            'description': 'Experience unparalleled luxury in the heart of the city. The Grand Plaza offers world-class amenities, Michelin-starred dining, and breathtaking views from every room.',
            'location': '123 Park Avenue, Downtown',
            'city': 'New York',
            'amenities': ['Wi-Fi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar'],
            'images': [
                'https://images.unsplash.com/photo-1762417422532-7bdaaf7d457a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85',
                'https://images.unsplash.com/photo-1765439178218-e54dcbb64bcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85'
            ],
            'rating': 4.8,
            'created_at': '2025-01-01T00:00:00+00:00'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Seaside Resort',
            'description': 'Escape to paradise at our beachfront resort. Wake up to ocean views, indulge in spa treatments, and dine on fresh seafood at our oceanside restaurant.',
            'location': '456 Ocean Drive',
            'city': 'Miami',
            'amenities': ['Beach Access', 'Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Water Sports'],
            'images': [
                'https://images.unsplash.com/photo-1766160703850-b3a2ccb78d2a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85',
                'https://images.unsplash.com/photo-1483744724400-dd3bfb1b71ea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGFtZW5pdGllcyUyMHBvb2wlMjBzcGElMjBkaW5pbmd8ZW58MHx8fHwxNzY4MzAyMjE2fDA&ixlib=rb-4.1.0&q=85'
            ],
            'rating': 4.7,
            'created_at': '2025-01-01T00:00:00+00:00'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Mountain Lodge',
            'description': 'Nestled in the mountains, our lodge offers a perfect retreat for nature lovers. Enjoy hiking trails, cozy fireplaces, and stunning alpine views.',
            'location': '789 Mountain Road',
            'city': 'Aspen',
            'amenities': ['Wi-Fi', 'Fireplace', 'Hiking', 'Restaurant', 'Ski Access'],
            'images': [
                'https://images.unsplash.com/photo-1762195804027-04a19d9d3ab6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85',
                'https://images.unsplash.com/photo-1765439178218-e54dcbb64bcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85'
            ],
            'rating': 4.6,
            'created_at': '2025-01-01T00:00:00+00:00'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Urban Boutique Hotel',
            'description': 'A stylish boutique hotel in the vibrant downtown area. Modern design meets comfort with curated art, rooftop bar, and personalized service.',
            'location': '321 Market Street',
            'city': 'San Francisco',
            'amenities': ['Wi-Fi', 'Rooftop Bar', 'Art Gallery', 'Gym', 'Restaurant'],
            'images': [
                'https://images.unsplash.com/photo-1765439178218-e54dcbb64bcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85',
                'https://images.unsplash.com/photo-1760573776062-7d2a7baeb49d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3IlMjBiZWRyb29tJTIwZGVzaWdufGVufDB8fHx8MTc2ODMwMjIxM3ww&ixlib=rb-4.1.0&q=85'
            ],
            'rating': 4.5,
            'created_at': '2025-01-01T00:00:00+00:00'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Historic Manor',
            'description': 'Stay in a beautifully restored 19th-century manor. Experience old-world charm with modern amenities, set in sprawling gardens.',
            'location': '654 Heritage Lane',
            'city': 'Boston',
            'amenities': ['Wi-Fi', 'Gardens', 'Library', 'Restaurant', 'Tea Room'],
            'images': [
                'https://images.unsplash.com/photo-1762417422532-7bdaaf7d457a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85',
                'https://images.unsplash.com/photo-1759264244746-140bbbc54e1b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3IlMjBiZWRyb29tJTIwZGVzaWdufGVufDB8fHx8MTc2ODMwMjIxM3ww&ixlib=rb-4.1.0&q=85'
            ],
            'rating': 4.7,
            'created_at': '2025-01-01T00:00:00+00:00'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Desert Oasis',
            'description': 'A luxurious retreat in the desert landscape. Infinity pools, spa treatments, and stargazing experiences create an unforgettable stay.',
            'location': '987 Desert View',
            'city': 'Phoenix',
            'amenities': ['Wi-Fi', 'Infinity Pool', 'Spa', 'Stargazing', 'Restaurant'],
            'images': [
                'https://images.unsplash.com/photo-1766160703850-b3a2ccb78d2a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85',
                'https://images.unsplash.com/photo-1695512073821-b18c0a7900e6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxob3RlbCUyMGFtZW5pdGllcyUyMHBvb2wlMjBzcGElMjBkaW5pbmd8ZW58MHx8fHwxNzY4MzAyMjE2fDA&ixlib=rb-4.1.0&q=85'
            ],
            'rating': 4.6,
            'created_at': '2025-01-01T00:00:00+00:00'
        }
    ]
    
    await db.hotels.insert_many(hotels_data)
    print(f"Created {len(hotels_data)} hotels")
    
    # Create rooms for each hotel
    room_types = [
        {
            'room_type': 'Deluxe Suite',
            'description': 'Spacious suite with separate living area, king bed, marble bathroom, and panoramic city views.',
            'price': 299.00,
            'capacity': 2,
            'amenities': ['King Bed', 'City View', 'Mini Bar', 'Coffee Maker', 'Bathtub']
        },
        {
            'room_type': 'Executive Room',
            'description': 'Elegant room with modern amenities, queen bed, work desk, and premium toiletries.',
            'price': 199.00,
            'capacity': 2,
            'amenities': ['Queen Bed', 'Work Desk', 'Smart TV', 'Coffee Maker']
        },
        {
            'room_type': 'Family Suite',
            'description': 'Perfect for families with two bedrooms, kitchenette, and spacious living area.',
            'price': 399.00,
            'capacity': 4,
            'amenities': ['Two Bedrooms', 'Kitchenette', 'Living Area', 'Sofa Bed']
        }
    ]
    
    room_images = [
        'https://images.unsplash.com/photo-1760573776062-7d2a7baeb49d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3IlMjBiZWRyb29tJTIwZGVzaWdufGVufDB8fHx8MTc2ODMwMjIxM3ww&ixlib=rb-4.1.0&q=85',
        'https://images.unsplash.com/photo-1759264244746-140bbbc54e1b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3IlMjBiZWRyb29tJTIwZGVzaWdufGVufDB8fHx8MTc2ODMwMjIxM3ww&ixlib=rb-4.1.0&q=85'
    ]
    
    rooms_data = []
    for hotel in hotels_data:
        for room_type in room_types:
            room = {
                'id': str(uuid.uuid4()),
                'hotel_id': hotel['id'],
                'room_type': room_type['room_type'],
                'description': room_type['description'],
                'price': room_type['price'],
                'capacity': room_type['capacity'],
                'amenities': room_type['amenities'],
                'images': room_images,
                'available': True
            }
            rooms_data.append(room)
    
    await db.rooms.insert_many(rooms_data)
    print(f"Created {len(rooms_data)} rooms")
    
    print("\\nSeed data created successfully!")
    print("\\nLogin credentials:")
    print("Admin: admin@luxestay.com / admin123")
    print("User: user@example.com / user123")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(seed_data())
