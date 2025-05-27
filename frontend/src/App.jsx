import Header from './components/Header'
import Footer from './components/Footer'
import { Route, Routes, useLocation, Navigate } from "react-router-dom"
import Home from './pages/Home'
import { ToastContainer } from "react-toastify"
import { Helmet, HelmetProvider } from 'react-helmet-async'
import BookingPage from './components/BookingPage'
import BookingConfirmation from "./components/BookingConfirmation"
import Payment from "./pages/Payment"
import Login from './pages/Login'
import Profile from './pages/Profile'
import Rooms from './pages/Rooms'
import MyReservations from './pages/MyReservations'
import ResetPassword from './pages/ResetPassword'
import About from './components/About'
import Contact from './pages/Contact'

const App = () => {
  const location = useLocation();
  const hideHeaderPaths = ["/login", "/signup", "/reset-password"];
  const hideFooterPaths = ["/login", "/signup", "/payment", "/booking-confirmation", "/reset-password"];
  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname);
  const shouldShowFooter = !hideFooterPaths.includes(location.pathname);

  return (
    <HelmetProvider>
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <main className='overflow-hidden text-text-dark font-body'>
        <ToastContainer />
        {shouldShowHeader && <Header />}
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/book/:roomId' element={<BookingPage />} />
          <Route path='/profile' element={<Profile />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/payment" element={<Payment />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          
          {/* Callback routes untuk Midtrans payment - redirect ke My Reservations */}
          <Route path="/payment-status/success" element={<Navigate to="/my-reservations" replace />} />
          <Route path="/payment-status/failed" element={<Navigate to="/my-reservations" replace />} />
          <Route path='/rooms' element={<Rooms />} />
          <Route path='/my-reservations' element={<MyReservations />} />
          <Route path='/reset-password' element={<ResetPassword />} />
        </Routes>
        {shouldShowFooter && <Footer />}
      </main>
    </HelmetProvider>
  )
}

export default App