import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import RoomManagement from "./pages/RoomManagement";
import Add from "./pages/Add";
import List from "./pages/List";
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
        <div className="bg-tertiary text-primary">
          <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row">
            <Sidebar setToken={setToken}/>
            <Routes>
              <Route path="/" element={<Add token={token}/>} />
              <Route path="/list" element={<List token={token}/>} />
              <Route path="/rooms" element={<RoomManagement token={token} />} />
              <Route path="/bookings" element={<BookingList token={token} />} />
            </Routes>
          </div>
        </div>
      )}
    </main>
  );
}
