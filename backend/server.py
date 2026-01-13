from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ['STRIPE_API_KEY']

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "user"  # user or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Hotel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location: str
    city: str
    amenities: List[str]
    images: List[str]
    rating: float = 4.5
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HotelCreate(BaseModel):
    name: str
    description: str
    location: str
    city: str
    amenities: List[str]
    images: List[str]
    rating: Optional[float] = 4.5

class Room(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hotel_id: str
    room_type: str
    description: str
    price: float
    capacity: int
    amenities: List[str]
    images: List[str]
    available: bool = True

class RoomCreate(BaseModel):
    hotel_id: str
    room_type: str
    description: str
    price: float
    capacity: int
    amenities: List[str]
    images: List[str]

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    room_id: str
    hotel_id: str
    check_in: str
    check_out: str
    guests: int
    total_price: float
    status: str = "pending"  # pending, confirmed, cancelled
    payment_status: str = "pending"  # pending, paid, failed
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    room_id: str
    hotel_id: str
    check_in: str
    check_out: str
    guests: int
    origin_url: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    booking_id: str
    user_id: str
    amount: float
    currency: str
    payment_status: str = "pending"
    metadata: Dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SearchQuery(BaseModel):
    city: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({'email': user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone
    )
    
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_jwt_token(user.id, user.email)
    
    return {
        'user': user.model_dump(),
        'token': token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['email'])
    
    user_response = {k: v for k, v in user.items() if k != 'password'}
    
    return {
        'user': user_response,
        'token': token
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== HOTEL ROUTES ====================

@api_router.get("/hotels")
async def get_hotels():
    hotels = await db.hotels.find({}, {'_id': 0}).to_list(1000)
    for hotel in hotels:
        if isinstance(hotel.get('created_at'), str):
            hotel['created_at'] = datetime.fromisoformat(hotel['created_at'])
    return hotels

@api_router.get("/hotels/{hotel_id}")
async def get_hotel(hotel_id: str):
    hotel = await db.hotels.find_one({'id': hotel_id}, {'_id': 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if isinstance(hotel.get('created_at'), str):
        hotel['created_at'] = datetime.fromisoformat(hotel['created_at'])
    return hotel

@api_router.post("/hotels", response_model=Hotel)
async def create_hotel(hotel_data: HotelCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    hotel = Hotel(**hotel_data.model_dump())
    doc = hotel.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.hotels.insert_one(doc)
    return hotel

@api_router.put("/hotels/{hotel_id}")
async def update_hotel(hotel_id: str, hotel_data: HotelCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.hotels.update_one(
        {'id': hotel_id},
        {'$set': hotel_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {'message': 'Hotel updated successfully'}

@api_router.delete("/hotels/{hotel_id}")
async def delete_hotel(hotel_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.hotels.delete_one({'id': hotel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {'message': 'Hotel deleted successfully'}

@api_router.post("/hotels/search")
async def search_hotels(query: SearchQuery):
    filter_query = {}
    if query.city:
        filter_query['city'] = {'$regex': query.city, '$options': 'i'}
    
    hotels = await db.hotels.find(filter_query, {'_id': 0}).to_list(1000)
    
    # If price filtering, get rooms and filter
    if query.min_price is not None or query.max_price is not None:
        filtered_hotels = []
        for hotel in hotels:
            rooms = await db.rooms.find({'hotel_id': hotel['id']}, {'_id': 0}).to_list(1000)
            has_room_in_range = any(
                (query.min_price is None or room['price'] >= query.min_price) and
                (query.max_price is None or room['price'] <= query.max_price)
                for room in rooms
            )
            if has_room_in_range:
                filtered_hotels.append(hotel)
        hotels = filtered_hotels
    
    return hotels

# ==================== ROOM ROUTES ====================

@api_router.get("/rooms")
async def get_rooms(hotel_id: Optional[str] = None):
    filter_query = {'hotel_id': hotel_id} if hotel_id else {}
    rooms = await db.rooms.find(filter_query, {'_id': 0}).to_list(1000)
    return rooms

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    room = await db.rooms.find_one({'id': room_id}, {'_id': 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@api_router.post("/rooms", response_model=Room)
async def create_room(room_data: RoomCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    room = Room(**room_data.model_dump())
    await db.rooms.insert_one(room.model_dump())
    return room

@api_router.put("/rooms/{room_id}")
async def update_room(room_id: str, room_data: RoomCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.rooms.update_one(
        {'id': room_id},
        {'$set': room_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {'message': 'Room updated successfully'}

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.rooms.delete_one({'id': room_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {'message': 'Room deleted successfully'}

# ==================== BOOKING ROUTES ====================

@api_router.post("/bookings")
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    room = await db.rooms.find_one({'id': booking_data.room_id}, {'_id': 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Calculate total price (simplified - days * room price)
    from datetime import datetime as dt
    check_in = dt.fromisoformat(booking_data.check_in.replace('Z', '+00:00'))
    check_out = dt.fromisoformat(booking_data.check_out.replace('Z', '+00:00'))
    days = (check_out - check_in).days
    if days < 1:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    
    total_price = float(room['price'] * days)
    
    booking = Booking(
        user_id=current_user['id'],
        room_id=booking_data.room_id,
        hotel_id=booking_data.hotel_id,
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        guests=booking_data.guests,
        total_price=total_price
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.bookings.insert_one(doc)
    
    # Create Stripe checkout session
    host_url = booking_data.origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{host_url}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/hotels/{booking_data.hotel_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_price,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            'booking_id': booking.id,
            'user_id': current_user['id'],
            'hotel_id': booking_data.hotel_id,
            'room_id': booking_data.room_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Update booking with session_id
    await db.bookings.update_one(
        {'id': booking.id},
        {'$set': {'payment_session_id': session.session_id}}
    )
    
    # Create payment transaction record
    payment_transaction = PaymentTransaction(
        session_id=session.session_id,
        booking_id=booking.id,
        user_id=current_user['id'],
        amount=total_price,
        currency="usd",
        metadata=checkout_request.metadata
    )
    
    payment_doc = payment_transaction.model_dump()
    payment_doc['created_at'] = payment_doc['created_at'].isoformat()
    await db.payment_transactions.insert_one(payment_doc)
    
    return {
        'booking': booking.model_dump(),
        'checkout_url': session.url,
        'session_id': session.session_id
    }

@api_router.get("/bookings/user/{user_id}")
async def get_user_bookings(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['id'] != user_id and current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    bookings = await db.bookings.find({'user_id': user_id}, {'_id': 0}).to_list(1000)
    for booking in bookings:
        if isinstance(booking.get('created_at'), str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({'id': booking_id}, {'_id': 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['user_id'] != current_user['id'] and current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    return booking

@api_router.get("/bookings")
async def get_all_bookings(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find({}, {'_id': 0}).to_list(1000)
    return bookings

# ==================== PAYMENT ROUTES ====================

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({'session_id': session_id}, {'_id': 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction['payment_status'] == 'paid':
        return transaction
    
    # Get status from Stripe
    host_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    await db.payment_transactions.update_one(
        {'session_id': session_id},
        {'$set': {'payment_status': status.payment_status}}
    )
    
    # Update booking if paid
    if status.payment_status == 'paid':
        await db.bookings.update_one(
            {'payment_session_id': session_id},
            {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
        )
    
    return {
        'session_id': session_id,
        'payment_status': status.payment_status,
        'status': status.status,
        'amount': status.amount_total / 100,
        'currency': status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    body = await request.body()
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {'session_id': webhook_response.session_id},
            {'$set': {'payment_status': webhook_response.payment_status}}
        )
        
        # Update booking if paid
        if webhook_response.payment_status == 'paid':
            await db.bookings.update_one(
                {'payment_session_id': webhook_response.session_id},
                {'$set': {'payment_status': 'paid', 'status': 'confirmed'}}
            )
        
        return {'status': 'success'}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()