import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import RoomManagement from "./pages/RoomManagement";
import Add from "./pages/Add";
import Statistics from "./pages/Statistics";
import BookingList from "./pages/BookingList";

export default function App() {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken && savedToken !== 'undefined' ? savedToken : "";
  });

  useEffect(() => {
    localStorage.setItem("token", token);
  }, [token]);

  return (
    <main>
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <div className="bg-tertiary text-primary min-h-screen flex flex-col sm:flex-row">
          {/* Sidebar - sticky hanya untuk desktop, horizontal di mobile */}
          <div className="sm:sticky sm:top-0 sm:h-screen overflow-hidden z-10 max-sm:static max-sm:w-full">
            <Sidebar setToken={setToken}/>
          </div>
          
          {/* Main content - dengan scrollbar */}
          <div className="flex-1 overflow-y-auto max-h-screen max-sm:h-[calc(100vh-65px)] max-sm:pt-2">
            <div className="w-full max-w-[1440px] px-2 sm:px-6 pb-8">
              <Routes>
                <Route path="/" element={<Add token={token}/>} />
                <Route path="/list" element={<Statistics token={token}/>} />
                <Route path="/rooms" element={<RoomManagement token={token} />} />
                <Route path="/bookings" element={<BookingList token={token} />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
