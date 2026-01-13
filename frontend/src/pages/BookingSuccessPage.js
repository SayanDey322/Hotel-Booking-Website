import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId, 0);
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sessionId, attempts) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`);
      setPaymentStatus(response.data);

      if (response.data.payment_status === 'paid') {
        setLoading(false);
        return;
      } else if (response.data.status === 'expired') {
        setLoading(false);
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navigation />
        <div className="pt-32 text-center">
          <p className="text-xl text-muted">Invalid booking link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navigation />

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-md shadow-lg p-12 text-center" data-testid="booking-success-page">
          {loading ? (
            <>
              <Loader className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
              <h2 className="text-3xl font-serif font-bold mb-4">Processing Your Payment...</h2>
              <p className="text-muted">Please wait while we confirm your booking</p>
            </>
          ) : paymentStatus?.payment_status === 'paid' ? (
            <>
              <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-600" data-testid="success-icon" />
              <h2 className="text-4xl font-serif font-bold mb-4 text-green-600">Booking Confirmed!</h2>
              <p className="text-xl text-muted mb-8">
                Your payment has been processed successfully.
              </p>
              <div className="bg-secondary rounded-sm p-6 mb-8">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-muted">Session ID</p>
                    <p className="font-mono text-sm" data-testid="session-id">{sessionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Amount Paid</p>
                    <p className="font-semibold text-lg" data-testid="amount-paid">${paymentStatus.amount} {paymentStatus.currency.toUpperCase()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/my-bookings')}
                  className="w-full bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 text-lg font-serif tracking-wide"
                  data-testid="view-bookings-button"
                >
                  View My Bookings
                </Button>
                <Button
                  onClick={() => navigate('/hotels')}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/5 rounded-none px-8 py-6 text-lg font-serif tracking-wide"
                  data-testid="browse-hotels-button"
                >
                  Browse More Hotels
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-3xl font-serif font-bold mb-4">Payment Issue</h2>
              <p className="text-muted mb-8">
                There was an issue processing your payment. Please try again or contact support.
              </p>
              <Button
                onClick={() => navigate('/hotels')}
                className="bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 text-lg font-serif tracking-wide"
                data-testid="back-to-hotels-button"
              >
                Back to Hotels
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;