import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCreditCard, FaMoneyBill } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatToIDR, convertToMidtransAmount } from '../utils/currency';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [bookingData, setBookingData] = useState(null);
  const [paymentSource, setPaymentSource] = useState(null); // 'new' or 'pending'
  const processingRef = useRef(false); // Mutex untuk mencegah double processing
  
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

  // Helper to clean up all storage
  const cleanupStorage = () => {
    console.log('Cleaning up storage for completed booking');
    // Clean up booking data regardless of payment source
    if (bookingData) {
      const bookingId = bookingData._id.replace('BOOK-', '');
      console.log(`Cleaning up booking with ID: ${bookingId}`);
      
      // Clean up session storage first
      sessionStorage.removeItem(`payment_${bookingId}`);
      sessionStorage.removeItem(`processing_${bookingId}`);
      sessionStorage.removeItem('currentNewBooking');
      
      // Get user email for user-specific storage
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = userData.email ? userData.email.toLowerCase().trim() : '';
        
        if (userEmail) {
          // 1. Clean from user-specific storage
          const userKey = `pendingBookings_${userEmail}`;
          console.log(`Cleaning from user-specific storage: ${userKey}`);
          
          let userPendingBookings = JSON.parse(localStorage.getItem(userKey) || '[]');
          const userOriginalCount = userPendingBookings.length;
          
          userPendingBookings = userPendingBookings.filter(b => {
            if (!b || !b._id) return true; // Keep invalid bookings for now
            const pendingId = b._id.replace('BOOK-', '');
            return pendingId !== bookingId;
          });
          
          localStorage.setItem(userKey, JSON.stringify(userPendingBookings));
          console.log(`Removed from ${userKey}, removed ${userOriginalCount - userPendingBookings.length} bookings`);
        } else {
          console.warn('No user email found, could not clean user-specific storage');
        }
      } catch (error) {
        console.error('Error cleaning user-specific storage:', error);
      }
      
      // 2. Always clean from global pendingBookings for backward compatibility
      try {
        let pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
        const originalCount = pendingBookings.length;
        
        pendingBookings = pendingBookings.filter(b => {
          if (!b || !b._id) return true; // Keep invalid bookings for now
          const pendingId = b._id.replace('BOOK-', '');
          return pendingId !== bookingId;
        });
        
        localStorage.setItem('pendingBookings', JSON.stringify(pendingBookings));
        console.log(`Removed from global pendingBookings, removed ${originalCount - pendingBookings.length} bookings`);
      } catch (error) {
        console.error('Error cleaning global pendingBookings:', error);
      }
    }
  };

  const handlePayment = async (method) => {
    setLoading(true);
    try {
      if (method === 'cash') {
        setLoading(true);
        try {
          // Generate a processing ID to prevent duplicates
          const processId = `cash_${Date.now()}`;
          console.log('Processing cash payment with ID:', processId);
          
          // Create booking with cash payment details directly
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/bookings`,
            {
              roomId: bookingData.roomId,
              checkIn: bookingData.checkIn,
              checkOut: bookingData.checkOut,
              numberOfGuests: bookingData.numberOfGuests,
              guestName: bookingData.guestName,
              guestEmail: bookingData.guestEmail,
              guestPhone: bookingData.guestPhone,
              specialRequests: bookingData.specialRequests || '',
              totalAmount: bookingData.totalAmount,
              // Struktur paymentDetails yang disesuaikan dengan model di backend
              // Mengirimkan flag status dengan jelas
              paymentDetails: {
                method: 'cash',  // Ini adalah enum di model
                amount: bookingData.totalAmount,
                status: 'Pay at Hotel',
                paymentType: 'cash_on_arrival',
                isCashPayment: true  // Flag tambahan untuk memastikan
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

          // Cleanup storage
          cleanupStorage();
          
          if (response.data.success) {
            toast.success('Cash payment recorded. Pay at hotel during check-in.');
            
            // Reset states
            setBookingData(null);
            processingRef.current = false;
            
            // Navigate to reservations page
            navigate('/my-reservations', { replace: true });
          } else {
            toast.error(response.data.message || 'Failed to record cash payment');
          }
          
        } catch (error) {
          console.error('Error processing cash payment:', error);
          toast.error('Failed to process cash payment. Please try again.');
        }
        
        setLoading(false);
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

      // Store original booking ID for tracking
      const originalBookingId = bookingData._id.replace('BOOK-', '');
      
      // For transaction tracking, use a consistent ID based on the booking
      // This ensures we don't create multiple transactions for the same booking
      const sessionKey = `payment_${originalBookingId}`;
      const existingTransaction = sessionStorage.getItem(sessionKey);
      
      // If transaction exists and is still active, use the same order ID
      let orderId;
      if (existingTransaction) {
        try {
          const transactionData = JSON.parse(existingTransaction);
          const currentTime = Date.now();
          
          // Check if transaction is expired
          if (transactionData.expiryTime && currentTime > transactionData.expiryTime) {
            console.log('Existing transaction expired, creating new one');
            // Continue to create new transaction
          } else {
            orderId = transactionData.orderId;
            console.log('Using existing transaction:', orderId);
          }
        } catch (error) {
          console.error('Error parsing existing transaction:', error);
          // Continue to create new transaction
        }
      }
      
      if (!orderId) {
        // Create new transaction with unique order ID
        orderId = `BOOK-${Date.now()}`;
        
        // Save transaction data in session storage with an expiry time (30 minutes)
        sessionStorage.setItem(sessionKey, JSON.stringify({
          orderId,
          bookingId: originalBookingId,
          timestamp: Date.now(),
          expiryTime: Date.now() + (30 * 60 * 1000), // 30 minutes expiry
          source: paymentSource
        }));
      }
      
      // Check if this booking already has a successful transaction
      try {
        const bookingCheck = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/bookings/${originalBookingId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (bookingCheck.data && bookingCheck.data.status === 'confirmed') {
          console.log('Booking already confirmed:', originalBookingId);
          toast.info('This booking has already been confirmed');
          cleanupStorage();
          navigate('/my-reservations', { replace: true });
          return;
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error('Error checking booking status:', error);
          // Continue with payment if we can't check the status
        }
      }
      
      // Check for processing lock, but allow restart after certain time
      const processingKey = `processing_${originalBookingId}`;
      const processingData = sessionStorage.getItem(processingKey);
      
      if (processingData) {
        // Check if the lock is old (more than 5 minutes)
        const processingTime = JSON.parse(processingData).timestamp;
        const currentTime = Date.now();
        const timeDiff = currentTime - processingTime;
        
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes in milliseconds
          console.log('Payment is already being processed for this booking');
          
          // Give option to force continue
          const forceContinue = window.confirm(
            'This booking appears to be in process already. This could happen if you closed your browser during payment.\n\nDo you want to restart the payment process?'
          );
          
          if (!forceContinue) {
            toast.info('Payment process cancelled');
            return;
          }
          
          console.log('User chose to force continue payment');
        }
      }
      
      // Set or update processing lock
      sessionStorage.setItem(processingKey, JSON.stringify({
        timestamp: Date.now(),
        bookingId: originalBookingId
      }));

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
        bookingId: originalBookingId,
        orderId: orderId,
        source: paymentSource,
        amount: bookingData.totalAmountMidtrans
      });

      // Use the cleanupStorage function defined at the top

      // Set a transaction ID to track this specific payment session
      const paymentSessionId = `payment_session_${Date.now()}`;
      sessionStorage.setItem('current_payment_session', paymentSessionId);
      
      // Set timeout to remove stale locks after 10 minutes
      const lockTimeout = setTimeout(() => {
        processingRef.current = false;
        sessionStorage.removeItem(`processing_${originalBookingId}`);
      }, 10 * 60 * 1000);
      
      window.snap.pay(response.data.token, {
        onSuccess: async (result) => {
          try {
            // Get the current payment session ID and compare
            const currentSession = sessionStorage.getItem('current_payment_session');
            if (currentSession !== paymentSessionId) {
              console.log('Ignoring duplicate callback from different payment session');
              return;
            }
            
            // Clear the session immediately to prevent further callbacks
            sessionStorage.removeItem('current_payment_session');
            clearTimeout(lockTimeout);
            
            // Gunakan mutex untuk mencegah double processing
            if (processingRef.current) {
              console.log('Payment already being processed');
              return;
            }
            processingRef.current = true;

            console.log('Payment success:', result);
            
            // Cleanup storage di awal untuk mencegah duplikasi
            cleanupStorage();
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
              // Show success message
              toast.success('Payment successful!');
              
              // Reset state completely
              setBookingData(null);
              processingRef.current = false;
              sessionStorage.removeItem(`processing_${originalBookingId}`);
              
              // Redirect to reservation page
              navigate('/my-reservations', { replace: true });
            }
          } catch (error) {
            console.error('Error in payment processing:', error);
            // Reset processing states
            processingRef.current = false;
            sessionStorage.removeItem(`processing_${originalBookingId}`);
            sessionStorage.removeItem('current_payment_session');
            clearTimeout(lockTimeout);
            
            // Show error message
            toast.error('Payment failed. Please try again.');
            
            // Redirect to reservation page
            navigate('/my-reservations', { replace: true });
            
            // Restore storage jika gagal
            if (paymentSource === 'pending') {
              const pendingBookings = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
              if (!pendingBookings.some(b => b._id === bookingData._id)) {
                pendingBookings.push(bookingData);
                localStorage.setItem('pendingBookings', JSON.stringify(pendingBookings));
              }
            }
            
            // Show error message
            toast.error('Payment failed. Please try again.');
          }
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          toast.info('Payment is pending. Please complete your payment.');
          setLoading(false);
          navigate('/my-reservations', { replace: true });
        },
        onError: (result) => {
          console.error('Payment error:', result);
          toast.error('Payment failed. Please try again.');
          setLoading(false);
          navigate('/my-reservations', { replace: true });
        },
        onClose: () => {
          // Reset processingRef
          processingRef.current = false;
          sessionStorage.removeItem(`processing_${originalBookingId}`);
          sessionStorage.removeItem('current_payment_session');
          clearTimeout(lockTimeout);

          console.log('Customer closed the popup without finishing the payment');
          toast.info('Payment cancelled');
          
          // Reset all states
          setLoading(false);
          
          // Keep the pending booking in localStorage
          // but clean up session storage
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
    <div className="min-h-screen bg-tertiary py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Complete Your Booking</h1>
          <p className="text-text-light">Choose your preferred payment method to secure your reservation</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-secondary text-primary px-6 md:px-8 py-6">
            <h2 className="text-xl md:text-2xl font-bold">Payment Details</h2>
            <p className="text-gray-700 text-sm md:text-base mt-2">Complete your booking by selecting a payment method</p>
          </div>

          {/* Booking Summary */}
          <div className="p-4 md:p-8 border-b border-gray-100 bg-white">
            <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-primary">Booking Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-light text-sm md:text-base">Room:</span>
                    <span className="font-medium text-sm md:text-base">{bookingData.roomName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-light text-sm md:text-base">Check-in:</span>
                    <span className="font-medium text-sm md:text-base">{formattedCheckIn}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-light text-sm md:text-base">Check-out:</span>
                    <span className="font-medium text-sm md:text-base">{formattedCheckOut}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t">
                    <span className="text-text-dark font-semibold text-sm md:text-base">Total Amount:</span>
                    <span className="text-secondary font-bold text-base md:text-lg">
                      {formatToIDR(bookingData.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-light text-sm md:text-base">Guest Name:</span>
                    <span className="font-medium text-sm md:text-base truncate max-w-[180px]">{bookingData.guestName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-light text-sm md:text-base">Email:</span>
                    <span className="font-medium text-sm md:text-base truncate max-w-[180px]">{bookingData.guestEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-light text-sm md:text-base">Phone:</span>
                    <span className="font-medium text-sm md:text-base">{bookingData.guestPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-4 md:p-8 bg-white rounded-b-lg">
            <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-primary">Choose Payment Method</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Pay Online Button */}
                <button
                  onClick={() => handlePayment('midtrans')}
                  disabled={loading}
                  className="w-full flex items-start justify-between p-4 md:p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-secondary transition-all duration-300 disabled:opacity-50 h-[110px] md:h-[130px]"
                >
                  <div className="flex items-start w-full">
                    <div className="bg-secondary p-2 md:p-3 rounded-lg w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                      <FaCreditCard className="text-primary text-lg md:text-xl" />
                    </div>
                    <div className="ml-3 md:ml-4 flex flex-col w-full">
                      <div className="flex flex-col">
                        <span className="text-base md:text-lg font-semibold text-primary">Pay Online</span>
                        <p className="text-xs md:text-sm text-text-light mt-1">{formatToIDR(bookingData.totalAmount)}</p>
                        <p className="text-xs md:text-sm text-secondary mt-1">Credit Card, Bank Transfer, E-Wallet</p>
                      </div>
                    </div>
                  </div>
                  <span className="text-secondary text-lg pt-6 md:text-xl flex-shrink-0">→</span>
                </button>

                {/* Pay at Hotel Button */}
                <button
                  onClick={() => handlePayment('cash')}
                  disabled={loading}
                  className="w-full flex items-start justify-between p-4 md:p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-secondary transition-all duration-300 disabled:opacity-50 h-[110px] md:h-[130px]"
                >
                  <div className="flex items-start w-full">
                    <div className="bg-secondary p-2 md:p-3 rounded-lg w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                      <FaMoneyBill className="text-primary text-lg md:text-xl" />
                    </div>
                    <div className="ml-3 md:ml-4 flex flex-col w-full">
                      <div className="flex flex-col">
                        <span className="text-base md:text-lg font-semibold text-primary">Pay at Hotel</span>
                        <p className="text-xs md:text-sm text-text-light mt-1">{formatToIDR(bookingData.totalAmount)}</p>
                        <p className="text-xs md:text-sm text-secondary mt-1">Cash payment upon check-in</p>
                      </div>
                    </div>
                  </div>
                  <span className="text-secondary text-lg pt-6 md:text-xl flex-shrink-0">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
