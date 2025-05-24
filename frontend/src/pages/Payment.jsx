import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCreditCard, FaMoneyBill } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatToIDR, convertToMidtransAmount } from '../utils/currency';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [paymentSource, setPaymentSource] = useState(null); // 'new' or 'pending'
  
  // Get booking data from URL params or location state
  useEffect(() => {
    const getBookingData = async () => {
      try {
        // Case 1: Complete payment from MyReservations (has bookingId in URL)
        const params = new URLSearchParams(location.search);
        const bookingId = params.get('bookingId');
        
        if (bookingId) {
          const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
          const selectedBooking = pendingBookings.find(b => b._id === bookingId);
          
          if (!selectedBooking) {
            toast.error('Booking not found');
            navigate('/my-reservations');
            return;
          }
          
          // For pending bookings, ensure we preserve the original booking ID
          const updatedBooking = {
            ...selectedBooking,
            _id: bookingId, // Use the exact same ID from URL
            totalAmountMidtrans: selectedBooking.totalAmountMidtrans || convertToMidtransAmount(selectedBooking.totalAmount)
          };
          setBookingData(updatedBooking);
          setPaymentSource('pending');
          return;
        }

        // Case 2: New booking from BookingPage
        if (location.state?.bookingData) {
          // Validate if this is really a new booking (not from MyReservations)
          const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
          const isPendingBooking = pendingBookings.some(b => b._id === location.state.bookingData._id);
          
          if (isPendingBooking) {
            // This is actually a pending booking, redirect to use the proper URL
            navigate(`/payment?bookingId=${location.state.bookingData._id}`);
            return;
          }

          setBookingData(location.state.bookingData);
          setPaymentSource('new');
          
          // Save to session storage temporarily (will be cleared after payment)
          sessionStorage.setItem('currentNewBooking', JSON.stringify(location.state.bookingData));
          return;
        }

        // Case 3: Check session storage for new booking (in case of page refresh)
        const savedNewBooking = sessionStorage.getItem('currentNewBooking');
        if (savedNewBooking) {
          setBookingData(JSON.parse(savedNewBooking));
          setPaymentSource('new');
          return;
        }

        // If no valid booking data found, redirect
        toast.error('No booking data found');
        navigate('/');
      } catch (error) {
        console.error('Error getting booking data:', error);
        toast.error('Error loading booking data');
        navigate('/');
      }
    };

    getBookingData();
  }, [location.search, location.state, navigate]);

  // Load Midtrans script
  useEffect(() => {
    const loadMidtransScript = () => {
      // Remove any existing Midtrans scripts first
      const existingScript = document.getElementById('midtrans-script');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script
      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-LMuTf8LJyM_9co_r');
      script.async = true;

      script.onload = () => {
        console.log('Midtrans script loaded successfully');
      };

      script.onerror = () => {
        console.error('Failed to load Midtrans script');
        toast.error('Failed to load payment system');
      };

      document.body.appendChild(script);
    };

    loadMidtransScript();

    // Cleanup on unmount
    return () => {
      const script = document.getElementById('midtrans-script');
      if (script) {
        script.remove();
      }
      // Clear saved booking data
      localStorage.removeItem('currentBooking');
    };
  }, []);

  // Redirect if no booking data
  if (!bookingData) {
    return null; // Loading state
  }

  // Format dates for display
  const checkInDate = new Date(bookingData.checkIn);
  const checkOutDate = new Date(bookingData.checkOut);
  const formattedCheckIn = checkInDate.toLocaleDateString();
  const formattedCheckOut = checkOutDate.toLocaleDateString();

  const handlePayment = async (method) => {
    setLoading(true);
    try {
      if (method === 'cash') {
        // Handle cash payment
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payments/cash`, {
          bookingId: bookingData._id,
          amount: bookingData.totalAmount
        });

        if (response.data.success) {
          toast.success('Cash payment recorded successfully');
          navigate('/my-reservations');
        } else {
          toast.error(response.data.message || 'Failed to record cash payment');
        }
        return;
      }

      // Handle Midtrans payment
      console.log('Initiating Midtrans payment with data:', {
        bookingId: bookingData._id,
        amount: bookingData.totalAmount,
        customerDetails: {
          firstName: bookingData.guestName.split(' ')[0],
          lastName: bookingData.guestName.split(' ').slice(1).join(' ') || '',
          email: bookingData.guestEmail,
          phone: bookingData.guestPhone
        }
      });

      // Check if this booking still exists in pendingBookings
      if (paymentSource === 'pending') {
        const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
        const bookingExists = pendingBookings.find(b => b._id === bookingData._id);
        
        if (!bookingExists) {
          toast.error('This booking has already been processed or cancelled.');
          navigate('/my-reservations', { replace: true });
          return;
        }
      }

      // Generate a new order ID for Midtrans
      const orderId = `BOOK-${Date.now()}`;
      // Store original booking ID for reference
      const originalBookingId = bookingData._id;

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/payments/midtrans`,
        {
          bookingId: originalBookingId,
          orderId: orderId,
          amount: bookingData.totalAmountMidtrans,
          customerDetails: {
            firstName: bookingData.guestName.split(' ')[0],
            lastName: bookingData.guestName.split(' ').slice(1).join(' ') || '',
            email: bookingData.guestEmail,
            phone: bookingData.guestPhone
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.data.token) {
        throw new Error('Invalid payment token received from server');
      }

      console.log('Processing payment for booking:', {
        bookingId: bookingData._id,
        source: paymentSource,
        amount: bookingData.totalAmountMidtrans
      });

      window.snap.pay(response.data.token, {

        onSuccess: async (result) => {
          // Prevent duplicate processing
          if (isProcessing) {
            console.log('Payment already being processed');
            return;
          }

          setIsProcessing(true);
          console.log('Payment success:', result);

          try {
            // Create new booking with payment details

            // Always create a new booking for both new and pending bookings
            const createBookingResponse = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/bookings`,
              {
                roomId: bookingData.roomId,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                numberOfGuests: bookingData.numberOfGuests,
                guestName: bookingData.guestName,
                guestEmail: bookingData.guestEmail,
                guestPhone: bookingData.guestPhone,
                specialRequests: bookingData.specialRequests,
                totalAmount: bookingData.totalAmount,
                totalAmountMidtrans: bookingData.totalAmountMidtrans,
                paymentDetails: {
                  method: 'midtrans',
                  transactionId: result.transaction_id,
                  orderId: orderId,
                  amount: parseFloat(result.gross_amount)
                },
                status: 'confirmed'
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (createBookingResponse.data.success) {
              // Clean up ALL storage to prevent duplicate bookings
              if (paymentSource === 'pending') {
                // Remove this booking from pendingBookings
                const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
                const updatedPendingBookings = pendingBookings.filter(b => b._id !== bookingData._id);
                localStorage.setItem('pendingBookings', JSON.stringify(updatedPendingBookings));
              }
              
              // Always clean up session storage
              sessionStorage.removeItem('currentNewBooking');
              
              // Clean up any payment-related state
              setBookingData(null);
              setPaymentSource(null);

              // Show success message
              toast.success('Payment successful!');
              
              // Clean up payment states
              setIsProcessing(false);
              setBookingData(null);
              
              // Use navigate with replace to prevent back navigation
              navigate('/my-reservations');
              return;
            } else {
              throw new Error('Failed to create booking');
            }
          } catch (error) {
            console.error('Error creating booking:', error);
            toast.error('Payment successful but booking failed to save. Please contact support.');
            setIsProcessing(false);
          }
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          toast.info('Payment is pending. Please complete your payment.');
          setLoading(false);
          setIsProcessing(false); // Reset processing state on pending
          navigate('/my-reservations', { replace: true });
        },
        onError: (result) => {
          console.error('Payment error:', result);
          toast.error('Payment failed. Please try again.');
          setLoading(false);
          setIsProcessing(false); // Reset processing state on error
          navigate('/my-reservations', { replace: true });
        },
        onClose: () => {
          console.log('Customer closed the popup without finishing the payment');
          toast.info('Payment cancelled');
          setLoading(false);
          setIsProcessing(false);
          
          // Always clean up session storage on close
          sessionStorage.removeItem('currentNewBooking');
          
          // Navigate back to my-reservations for pending bookings
          if (paymentSource === 'pending') {
            navigate('/my-reservations', { replace: true });
          }
        }
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Booking</h1>
          <p className="text-gray-200">Choose your preferred payment method to secure your reservation</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-6">
            <h2 className="text-3xl font-bold">Payment Details</h2>
            <p className="text-gray-200 mt-2">Complete your booking by selecting a payment method</p>
          </div>

          {/* Booking Summary */}
          <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <h3 className="text-2xl font-semibold mb-6 text-primary">Booking Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{bookingData.roomName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{formattedCheckIn}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{formattedCheckOut}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-gray-900 font-semibold">Total Amount:</span>
                    <span className="text-primary font-bold text-xl">
                      {formatToIDR(bookingData.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Guest Name:</span>
                    <span className="font-medium">{bookingData.guestName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{bookingData.guestEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{bookingData.guestPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-b-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-primary">Choose Payment Method</h3>
            <div className="space-y-4">
              <button
                onClick={() => handlePayment('midtrans')}
                disabled={loading}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white border-2 border-primary rounded-xl hover:shadow-lg hover:border-secondary transition-all duration-300 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaCreditCard className="text-white text-2xl" />
                  </div>
                  <div className="ml-4">
                    <span className="text-lg font-semibold text-primary">Pay Online</span>
                    <p className="text-sm text-gray-600 mt-1">{formatToIDR(bookingData.totalAmount)}</p>
                    <p className="text-sm text-secondary mt-1">Credit Card, Bank Transfer, E-Wallet</p>
                  </div>
                </div>
                <span className="text-primary text-xl">→</span>
              </button>

              <button
                onClick={() => handlePayment('cash')}
                disabled={loading}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaMoneyBill className="text-white text-2xl" />
                  </div>
                  <div className="ml-4">
                    <span className="text-lg font-semibold text-primary">Pay at Hotel</span>
                    <p className="text-sm text-gray-600 mt-1">{formatToIDR(bookingData.totalAmount)}</p>
                    <p className="text-sm text-secondary mt-1">Cash payment upon check-in</p>
                  </div>
                </div>
                <span className="text-primary text-xl">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
