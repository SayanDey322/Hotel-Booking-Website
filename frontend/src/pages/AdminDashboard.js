import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Hotel, DoorOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHotelDialog, setShowHotelDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const [hotelForm, setHotelForm] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    amenities: '',
    images: '',
    rating: 4.5
  });

  const [roomForm, setRoomForm] = useState({
    hotel_id: '',
    room_type: '',
    description: '',
    price: '',
    capacity: 2,
    amenities: '',
    images: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast.error('Admin access required');
      navigate('/');
    } else if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [hotelsRes, roomsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/hotels`),
        axios.get(`${API}/rooms`),
        axios.get(`${API}/bookings`)
      ]);
      setHotels(hotelsRes.data);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...hotelForm,
        amenities: hotelForm.amenities.split(',').map(a => a.trim()),
        images: hotelForm.images.split(',').map(i => i.trim()),
        rating: parseFloat(hotelForm.rating)
      };
      await axios.post(`${API}/hotels`, data);
      toast.success('Hotel created successfully');
      setShowHotelDialog(false);
      fetchData();
      resetHotelForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create hotel');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...roomForm,
        amenities: roomForm.amenities.split(',').map(a => a.trim()),
        images: roomForm.images.split(',').map(i => i.trim()),
        price: parseFloat(roomForm.price),
        capacity: parseInt(roomForm.capacity)
      };
      await axios.post(`${API}/rooms`, data);
      toast.success('Room created successfully');
      setShowRoomDialog(false);
      fetchData();
      resetRoomForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create room');
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    try {
      await axios.delete(`${API}/hotels/${hotelId}`);
      toast.success('Hotel deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete hotel');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await axios.delete(`${API}/rooms/${roomId}`);
      toast.success('Room deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const resetHotelForm = () => {
    setHotelForm({
      name: '',
      description: '',
      location: '',
      city: '',
      amenities: '',
      images: '',
      rating: 4.5
    });
  };

  const resetRoomForm = () => {
    setRoomForm({
      hotel_id: '',
      room_type: '',
      description: '',
      price: '',
      capacity: 2,
      amenities: '',
      images: ''
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navigation />
        <div className="pt-32 text-center">
          <p className="text-xl text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navigation />

      <div className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8" data-testid="admin-dashboard-title">Admin Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-md shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">Total Hotels</p>
                  <p className="text-3xl font-bold" data-testid="total-hotels">{hotels.length}</p>
                </div>
                <Hotel className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="bg-white rounded-md shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">Total Rooms</p>
                  <p className="text-3xl font-bold" data-testid="total-rooms">{rooms.length}</p>
                </div>
                <DoorOpen className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="bg-white rounded-md shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold" data-testid="total-bookings">{bookings.length}</p>
                </div>
                <Calendar className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>

          <Tabs defaultValue="hotels" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="hotels" data-testid="hotels-tab">Hotels</TabsTrigger>
              <TabsTrigger value="rooms" data-testid="rooms-tab">Rooms</TabsTrigger>
              <TabsTrigger value="bookings" data-testid="bookings-tab">Bookings</TabsTrigger>
            </TabsList>

            {/* Hotels Tab */}
            <TabsContent value="hotels">
              <div className="bg-white rounded-md shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold">Manage Hotels</h2>
                  <Dialog open={showHotelDialog} onOpenChange={setShowHotelDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-white hover:bg-primary/90 rounded-none" data-testid="add-hotel-button">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Hotel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Hotel</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateHotel} className="space-y-4" data-testid="hotel-form">
                        <div>
                          <Label>Hotel Name</Label>
                          <Input
                            value={hotelForm.name}
                            onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                            required
                            data-testid="hotel-name-input"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={hotelForm.description}
                            onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                            required
                            data-testid="hotel-description-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={hotelForm.location}
                              onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })}
                              required
                              data-testid="hotel-location-input"
                            />
                          </div>
                          <div>
                            <Label>City</Label>
                            <Input
                              value={hotelForm.city}
                              onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                              required
                              data-testid="hotel-city-input"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Amenities (comma-separated)</Label>
                          <Input
                            value={hotelForm.amenities}
                            onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                            placeholder="Wi-Fi, Pool, Gym, Breakfast"
                            required
                            data-testid="hotel-amenities-input"
                          />
                        </div>
                        <div>
                          <Label>Image URLs (comma-separated)</Label>
                          <Textarea
                            value={hotelForm.images}
                            onChange={(e) => setHotelForm({ ...hotelForm, images: e.target.value })}
                            placeholder="https://image1.jpg, https://image2.jpg"
                            required
                            data-testid="hotel-images-input"
                          />
                        </div>
                        <div>
                          <Label>Rating</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={hotelForm.rating}
                            onChange={(e) => setHotelForm({ ...hotelForm, rating: e.target.value })}
                            required
                            data-testid="hotel-rating-input"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 rounded-none" data-testid="submit-hotel-button">
                          Create Hotel
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4" data-testid="hotels-list">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="border border-stone-200 rounded-sm p-4 flex items-center justify-between" data-testid={`hotel-item-${hotel.id}`}>
                      <div className="flex items-center space-x-4">
                        <img src={hotel.images[0]} alt={hotel.name} className="w-20 h-20 object-cover rounded-sm" />
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`hotel-name-${hotel.id}`}>{hotel.name}</h3>
                          <p className="text-sm text-muted">{hotel.city}</p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteHotel(hotel.id)}
                        data-testid={`delete-hotel-${hotel.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Rooms Tab */}
            <TabsContent value="rooms">
              <div className="bg-white rounded-md shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold">Manage Rooms</h2>
                  <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-white hover:bg-primary/90 rounded-none" data-testid="add-room-button">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Room</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateRoom} className="space-y-4" data-testid="room-form">
                        <div>
                          <Label>Select Hotel</Label>
                          <select
                            value={roomForm.hotel_id}
                            onChange={(e) => setRoomForm({ ...roomForm, hotel_id: e.target.value })}
                            className="w-full h-12 border border-stone-200 rounded-sm px-3"
                            required
                            data-testid="room-hotel-select"
                          >
                            <option value="">Select a hotel</option>
                            {hotels.map(hotel => (
                              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Room Type</Label>
                          <Input
                            value={roomForm.room_type}
                            onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                            placeholder="Deluxe Suite, Standard Room, etc."
                            required
                            data-testid="room-type-input"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={roomForm.description}
                            onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                            required
                            data-testid="room-description-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Price per Night</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={roomForm.price}
                              onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                              required
                              data-testid="room-price-input"
                            />
                          </div>
                          <div>
                            <Label>Capacity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={roomForm.capacity}
                              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                              required
                              data-testid="room-capacity-input"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Amenities (comma-separated)</Label>
                          <Input
                            value={roomForm.amenities}
                            onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                            placeholder="King Bed, WiFi, TV"
                            required
                            data-testid="room-amenities-input"
                          />
                        </div>
                        <div>
                          <Label>Image URLs (comma-separated)</Label>
                          <Textarea
                            value={roomForm.images}
                            onChange={(e) => setRoomForm({ ...roomForm, images: e.target.value })}
                            placeholder="https://image1.jpg, https://image2.jpg"
                            required
                            data-testid="room-images-input"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 rounded-none" data-testid="submit-room-button">
                          Create Room
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4" data-testid="rooms-list">
                  {rooms.map((room) => {
                    const hotel = hotels.find(h => h.id === room.hotel_id);
                    return (
                      <div key={room.id} className="border border-stone-200 rounded-sm p-4 flex items-center justify-between" data-testid={`room-item-${room.id}`}>
                        <div className="flex items-center space-x-4">
                          <img src={room.images[0]} alt={room.room_type} className="w-20 h-20 object-cover rounded-sm" />
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`room-type-${room.id}`}>{room.room_type}</h3>
                            <p className="text-sm text-muted">{hotel?.name || 'Hotel'} - ${room.price}/night</p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                          data-testid={`delete-room-${room.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <div className="bg-white rounded-md shadow-md p-6">
                <h2 className="text-2xl font-serif font-bold mb-6">All Bookings</h2>
                <div className="space-y-4" data-testid="bookings-list">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-stone-200 rounded-sm p-4" data-testid={`booking-item-${booking.id}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted">Booking ID</p>
                          <p className="font-mono text-sm" data-testid={`booking-id-${booking.id}`}>{booking.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted">Check-in</p>
                          <p className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted">Check-out</p>
                          <p className="font-medium">{new Date(booking.check_out).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted">Total</p>
                          <p className="font-bold text-primary">${booking.total_price}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-sm text-sm font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-muted">
                          Payment: <span className="font-semibold">{booking.payment_status.toUpperCase()}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;