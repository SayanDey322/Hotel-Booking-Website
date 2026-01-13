import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MyBookingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState({});
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchBookings();
    }
  }, [user, authLoading]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/user/${user.id}`);
      const bookingsData = response.data;
      setBookings(bookingsData);

      // Fetch hotel and room details
      const hotelIds = [...new Set(bookingsData.map(b => b.hotel_id))];
      const roomIds = [...new Set(bookingsData.map(b => b.room_id))];

      const hotelPromises = hotelIds.map(id => axios.get(`${API}/hotels/${id}`).catch(() => null));
      const roomPromises = roomIds.map(id => axios.get(`${API}/rooms/${id}`).catch(() => null));

      const [hotelsData, roomsData] = await Promise.all([
        Promise.all(hotelPromises),
        Promise.all(roomPromises)
      ]);

      const hotelsMap = {};
      hotelsData.forEach(res => {
        if (res) hotelsMap[res.data.id] = res.data;
      });

      const roomsMap = {};
      roomsData.forEach(res => {
        if (res) roomsMap[res.data.id] = res.data;
      });

      setHotels(hotelsMap);
      setRooms(roomsMap);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navigation />
        <div className="pt-32 text-center">
          <p className="text-xl text-muted">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navigation />

      <div className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8" data-testid="my-bookings-title">My Bookings</h1>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-md shadow-md p-12 text-center">
              <p className="text-xl text-muted mb-6">You don't have any bookings yet</p>
              <Button
                onClick={() => navigate('/hotels')}
                className="bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 font-serif tracking-wide"
                data-testid="browse-hotels-button"
              >
                Browse Hotels
              </Button>
            </div>
          ) : (
            <div className="space-y-6" data-testid="bookings-list">
              {bookings.map((booking) => {
                const hotel = hotels[booking.hotel_id];
                const room = rooms[booking.room_id];

                return (
                  <div key={booking.id} className="bg-white rounded-md shadow-md overflow-hidden" data-testid={`booking-card-${booking.id}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4">
                      <div className="h-48 md:h-auto">
                        <img
                          src={hotel?.images[0] || 'https://via.placeholder.com/400'}
                          alt={hotel?.name || 'Hotel'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-3 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-serif font-semibold mb-2" data-testid={`hotel-name-${booking.id}`}>
                              {hotel?.name || 'Hotel'}
                            </h3>
                            {hotel && (
                              <div className="flex items-center text-muted mb-2">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">{hotel.city}</span>
                              </div>
                            )}
                            <p className="text-muted" data-testid={`room-type-${booking.id}`}>{room?.room_type || 'Room'}</p>
                          </div>
                          <div className={`flex items-center space-x-2 px-4 py-2 rounded-sm ${getStatusColor(booking.status)}`} data-testid={`booking-status-${booking.id}`}>
                            {getStatusIcon(booking.status)}
                            <span className="font-semibold capitalize">{booking.status}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted mb-1">Check-in</p>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium" data-testid={`check-in-${booking.id}`}>
                                {new Date(booking.check_in).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted mb-1">Check-out</p>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span className="font-medium" data-testid={`check-out-${booking.id}`}>
                                {new Date(booking.check_out).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted mb-1">Total Price</p>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1 text-primary" />
                              <span className="font-bold text-xl text-primary" data-testid={`total-price-${booking.id}`}>
                                ${booking.total_price}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                          <div className="text-sm text-muted">
                            Booking ID: <span className="font-mono" data-testid={`booking-id-${booking.id}`}>{booking.id}</span>
                          </div>
                          <div className="text-sm">
                            Payment: <span className={`font-semibold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`} data-testid={`payment-status-${booking.id}`}>
                              {booking.payment_status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;