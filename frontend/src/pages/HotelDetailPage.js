import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Users, Wifi, Coffee, Dumbbell, Waves, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import Navigation from '../components/Navigation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const amenityIcons = {
  'Wi-Fi': Wifi,
  'Breakfast': Coffee,
  'Gym': Dumbbell,
  'Pool': Waves,
};

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    check_in: '',
    check_out: '',
    guests: 1
  });

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  const fetchHotelDetails = async () => {
    try {
      const [hotelRes, roomsRes] = await Promise.all([
        axios.get(`${API}/hotels/${hotelId}`),
        axios.get(`${API}/rooms?hotel_id=${hotelId}`)
      ]);
      setHotel(hotelRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      toast.error('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (room) => {
    if (!user) {
      toast.error('Please sign in to book a room');
      navigate('/auth');
      return;
    }

    if (!bookingData.check_in || !bookingData.check_out) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    const checkIn = new Date(bookingData.check_in);
    const checkOut = new Date(bookingData.check_out);
    if (checkOut <= checkIn) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/bookings`, {
        room_id: room.id,
        hotel_id: hotelId,
        check_in: new Date(bookingData.check_in).toISOString(),
        check_out: new Date(bookingData.check_out).toISOString(),
        guests: parseInt(bookingData.guests),
        origin_url: originUrl
      });

      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navigation />
        <div className="pt-32 text-center">
          <p className="text-xl text-muted">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navigation />
        <div className="pt-32 text-center">
          <p className="text-xl text-muted">Hotel not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navigation />

      <div className="pt-24">
        {/* Hero Image */}
        <div className="relative h-96 md:h-[500px]">
          <img
            src={hotel.images[0]}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-6 h-6 fill-accent text-accent" />
                <span className="text-xl font-semibold">{hotel.rating}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4" data-testid="hotel-name">{hotel.name}</h1>
              <div className="flex items-center text-lg">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{hotel.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Hotel Info */}
            <div className="lg:col-span-2">
              <section className="mb-12">
                <h2 className="text-3xl font-serif font-bold mb-6">About This Hotel</h2>
                <p className="text-muted text-lg leading-relaxed">{hotel.description}</p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-serif font-bold mb-6">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, index) => {
                    const Icon = amenityIcons[amenity] || Wifi;
                    return (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-sm">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Available Rooms */}
              <section>
                <h2 className="text-3xl font-serif font-bold mb-6">Available Rooms</h2>
                <div className="space-y-6" data-testid="rooms-list">
                  {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-md shadow-md overflow-hidden" data-testid={`room-card-${room.id}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="h-48 md:h-auto">
                          <img
                            src={room.images[0]}
                            alt={room.room_type}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="md:col-span-2 p-6">
                          <h3 className="text-2xl font-serif font-semibold mb-2" data-testid={`room-type-${room.id}`}>{room.room_type}</h3>
                          <p className="text-muted mb-4">{room.description}</p>
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-muted" />
                              <span className="text-sm text-muted">Up to {room.capacity} guests</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-3xl font-serif font-bold text-primary" data-testid={`room-price-${room.id}`}>${room.price}</span>
                              <span className="text-muted"> / night</span>
                            </div>
                            <Button
                              onClick={() => handleBooking(room)}
                              className="bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 font-serif tracking-wide"
                              data-testid={`book-room-button-${room.id}`}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column - Booking Widget */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-md shadow-lg p-6 sticky top-24" data-testid="booking-widget">
                <h3 className="text-2xl font-serif font-bold mb-6">Book Your Stay</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="check-in">Check-in</Label>
                    <Input
                      id="check-in"
                      type="date"
                      value={bookingData.check_in}
                      onChange={(e) => setBookingData({ ...bookingData, check_in: e.target.value })}
                      className="mt-2 h-12"
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="check-in-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="check-out">Check-out</Label>
                    <Input
                      id="check-out"
                      type="date"
                      value={bookingData.check_out}
                      onChange={(e) => setBookingData({ ...bookingData, check_out: e.target.value })}
                      className="mt-2 h-12"
                      min={bookingData.check_in || new Date().toISOString().split('T')[0]}
                      data-testid="check-out-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guests">Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="10"
                      value={bookingData.guests}
                      onChange={(e) => setBookingData({ ...bookingData, guests: e.target.value })}
                      className="mt-2 h-12"
                      data-testid="guests-input"
                    />
                  </div>
                  <p className="text-sm text-muted mt-4">
                    Select your dates and click "Book Now" on your preferred room
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;