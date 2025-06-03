import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { backend_url } from '../constants';
import { FaChartBar, FaChartPie, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

/**
 * Format price to IDR with K suffix
 * @param {number} amount - Amount in thousands (e.g., 150 for 150K)
 * @returns {string} Formatted string (e.g., "IDR 150K")
 */
const formatToIDR = (amount) => {
  // Nilai amount sudah dalam ribuan dari database
  // Jika nilai tidak valid, tampilkan 0
  return `IDR ${amount || 0}K`;
};

const Statistics = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Warna yang sesuai dengan tema website - menggunakan useMemo untuk optimasi
  const colors = useMemo(() => ({
    primary: '#0f1a2c',
    secondary: '#f6ac0f',
    tertiary: '#f4f4f7',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    pending: '#6366f1',
    confirmed: '#10b981',
    checkedIn: '#10b981',
    checkedOut: '#6b7280',
    cancelled: '#ef4444'
  }), []);

  // Fetch data booking dan kamar
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch bookings
        const bookingsResponse = await axios.get(`${backend_url}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let bookingsData = [];
        if (bookingsResponse.data) {
          if (Array.isArray(bookingsResponse.data)) {
            bookingsData = bookingsResponse.data;
          } else if (bookingsResponse.data.bookings && Array.isArray(bookingsResponse.data.bookings)) {
            bookingsData = bookingsResponse.data.bookings;
          }
        }
        
        // Transform string dates to Date objects
        const processedBookings = bookingsData.map(booking => ({
          ...booking,
          checkIn: booking.checkIn ? parseISO(new Date(booking.checkIn).toISOString()) : new Date(),
          checkOut: booking.checkOut ? parseISO(new Date(booking.checkOut).toISOString()) : new Date(),
          createdAt: booking.createdAt ? parseISO(new Date(booking.createdAt).toISOString()) : new Date(),
        }));
        
        setBookings(processedBookings);
        
        // Fetch rooms
        const roomsResponse = await axios.get(`${backend_url}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setRooms(Array.isArray(roomsResponse.data) ? roomsResponse.data : []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  // --- CALCULATED STATISTICS ---
  
  // 1. Booking by Status (untuk Pie Chart)
  const bookingsByStatus = useMemo(() => {
    const statusCount = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      checked_in: 0,
      checked_out: 0
    };
    
    bookings.forEach(booking => {
      if (Object.prototype.hasOwnProperty.call(statusCount, booking.status)) {
        statusCount[booking.status]++;
      }
    });
    
    return Object.keys(statusCount).map(status => ({
      name: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
      value: statusCount[status],
      color: status === 'pending' ? colors.pending 
        : status === 'confirmed' ? colors.confirmed
        : status === 'checked_in' ? colors.checkedIn
        : status === 'checked_out' ? colors.checkedOut
        : colors.cancelled
    }));
  }, [bookings, colors]);
  
  // 2. Total Revenue
  const totalRevenue = useMemo(() => {
    // Filter bookings yang tidak cancelled
    const validBookings = bookings.filter(booking => booking.status !== 'cancelled');
    
    // Log untuk debugging
    console.log('Calculating Total Revenue:');
    console.log('Total non-cancelled bookings:', validBookings.length);
    
    // Log detail setiap booking untuk analisis
    validBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalAmount: booking.totalAmount,
        status: booking.status
      });
    });
    
    // Hitung total revenue
    const total = validBookings.reduce((sum, booking) => {
      // Jika totalAmount tidak valid (undefined, null, NaN), gunakan 0
      const amount = booking.totalAmount || 0;
      console.log(`Adding amount: ${amount}K from booking ${booking._id}`);
      return sum + amount;
    }, 0);
    
    console.log('Final Total Revenue:', total + 'K');
    return total;
  }, [bookings]);
  
  // 3. Monthly Revenue Data (untuk Bar Chart)
  const monthlyRevenueData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Initialize revenue for each day
    const dailyRevenue = days.map(day => ({
      date: day,
      revenue: 0,
      bookings: 0
    }));
    
    // Fill in revenue data
    bookings.forEach(booking => {
      if (booking.status !== 'cancelled' && booking.createdAt) {
        const bookingDate = booking.createdAt;
        const dayIndex = dailyRevenue.findIndex(day => 
          isSameDay(day.date, bookingDate)
        );
        
        if (dayIndex !== -1) {
          dailyRevenue[dayIndex].revenue += booking.totalAmount || 0;
          dailyRevenue[dayIndex].bookings += 1;
        }
      }
    });
    
    // Format for chart
    return dailyRevenue.map(day => ({
      name: format(day.date, 'dd'),
      revenue: day.revenue,
      bookings: day.bookings
    }));
  }, [bookings, selectedMonth]);
  
  // 4. Room Type Distribution (untuk Bar Chart)
  const roomTypeData = useMemo(() => {
    const roomTypeCount = {};
    const roomTypeBookings = {};
    
    // Inisialisasi perhitungan
    rooms.forEach(room => {
      if (!roomTypeCount[room.roomType]) {
        roomTypeCount[room.roomType] = 0;
        roomTypeBookings[room.roomType] = 0;
      }
      
      // Menggunakan nilai totalRooms dari setiap kamar (default 5 jika tidak ada)
      roomTypeCount[room.roomType] += (room.totalRooms || 5);
    });
    
    // Log untuk debugging
    console.log('Room Type Distribution:');
    console.log('Total rooms by type:', roomTypeCount);
    
    // Count bookings for each room type
    bookings.forEach(booking => {
      if (booking.roomType && Object.prototype.hasOwnProperty.call(roomTypeBookings, booking.roomType)) {
        roomTypeBookings[booking.roomType]++;
      }
    });
    
    return Object.keys(roomTypeCount).map(type => ({
      name: type,
      rooms: roomTypeCount[type],
      bookings: roomTypeBookings[type]
    }));
  }, [rooms, bookings]);
  
  // 5. Booking Trends (Last 6 months) - untuk Line Chart
  const bookingTrends = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthlyBookings = bookings.filter(booking => {
        const bookingDate = booking.createdAt;
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
      
      const confirmed = monthlyBookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out').length;
      const cancelled = monthlyBookings.filter(b => b.status === 'cancelled').length;
      const revenue = monthlyBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      return {
        name: format(month, 'MMM'),
        bookings: monthlyBookings.length,
        confirmed,
        cancelled,
        revenue
      };
    });
  }, [bookings]);
  
  // 6. Payment Method Distribution (untuk Pie Chart)
  const paymentMethodData = useMemo(() => {
    const methods = {
      cash: 0,
      midtrans: 0,
      other: 0
    };
    
    bookings.forEach(booking => {
      if (booking.paymentDetails && booking.paymentDetails.method) {
        if (Object.prototype.hasOwnProperty.call(methods, booking.paymentDetails.method)) {
          methods[booking.paymentDetails.method]++;
        } else {
          methods.other++;
        }
      }
    });
    
    return [
      { name: 'Cash', value: methods.cash, color: colors.success },
      { name: 'Midtrans', value: methods.midtrans, color: colors.info },
      { name: 'Other', value: methods.other, color: colors.warning }
    ];
  }, [bookings, colors]);
  
  // --- CHART COMPONENTS ---
  
  // Custom tooltip untuk chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-md border border-gray-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') || entry.name === 'revenue' 
                ? formatToIDR(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };
  
  // Month selector component
  const MonthSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setSelectedMonth(prevMonth => subMonths(prevMonth, 1))}
          className="p-2 rounded-full hover:bg-tertiary transition-colors"
        >
          &lt;
        </button>
        <span className="font-medium">{format(selectedMonth, 'MMMM yyyy')}</span>
        <button 
          onClick={() => setSelectedMonth(prevMonth => addMonths(prevMonth, 1))}
          className="p-2 rounded-full hover:bg-tertiary transition-colors"
        >
          &gt;
        </button>
      </div>
    );
  };
  
  // Stat Card Component
  const StatCard = ({ title, value, icon, color, subtext }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4`} style={{ backgroundColor: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </div>
  );
  
  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.element,
    color: PropTypes.string,
    subtext: PropTypes.string
  };
  
  // Main layout
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-tertiary min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
        <p className="text-gray-500">Welcome to your WG Hotel statistics dashboard</p>
      </div>
      
      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Bookings" 
          value={bookings.length} 
          icon={<FaChartBar size={20} />}
          color={colors.secondary}
          subtext="All time bookings"
        />
        <StatCard 
          title="Confirmed Bookings" 
          value={bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out').length} 
          icon={<FaCalendarAlt size={20} />}
          color={colors.confirmed}
          subtext="Successfully confirmed"
        />
        <StatCard 
          title="Total Revenue" 
          value={formatToIDR(totalRevenue)} 
          icon={<FaMoneyBillWave size={20} />}
          color={colors.success}
          subtext="From all confirmed bookings"
        />
        <StatCard 
          title="Room Types" 
          value={Object.keys(rooms.reduce((acc, room) => {
            acc[room.roomType] = true;
            return acc;
          }, {})).length} 
          icon={<FaChartPie size={20} />}
          color={colors.secondary}
          subtext="Available room types"
        />
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Monthly Revenue</h2>
            <MonthSelector />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke={colors.primary} />
                <YAxis yAxisId="right" orientation="right" stroke={colors.secondary} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (IDR)" fill={colors.primary} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="bookings" name="Bookings" fill={colors.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Booking Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-6">Booking Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  fill="#8884d8"
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent, x, y, midAngle }) => {
                    // Only show label if percent is greater than 1%
                    if (percent < 0.01) return null;
                    
                    // Adjust position based on angle
                    const radius = 135; // slightly outside the pie
                    const sin = Math.sin(-midAngle * Math.PI / 180);
                    const cos = Math.cos(-midAngle * Math.PI / 180);
                    const labelX = x + (radius * sin);
                    const labelY = y + (radius * cos);
                    
                    return (
                      <text 
                        x={labelX} 
                        y={labelY} 
                        fill={colors.success}
                        textAnchor={midAngle > 0 ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontWeight="500"
                        fontSize="12"
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {bookingsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Room Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-6">Room Type Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roomTypeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="rooms" name="Total Rooms" fill={colors.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill={colors.secondary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Payment Methods Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-6">Payment Methods</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent, x, y, midAngle }) => {
                    // Only show label if percent is greater than 1%
                    if (percent < 0.01) return null;
                    
                    // Adjust position based on angle
                    const radius = 135; // slightly outside the pie
                    const sin = Math.sin(-midAngle * Math.PI / 180);
                    const cos = Math.cos(-midAngle * Math.PI / 180);
                    const labelX = x + (radius * sin);
                    const labelY = y + (radius * cos);
                    
                    return (
                      <text 
                        x={labelX} 
                        y={labelY} 
                        fill={colors.primary}
                        textAnchor={midAngle > 0 ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontWeight="500"
                        fontSize="12"
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 3 */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-bold text-primary mb-6">Booking Trends (Last 6 Months)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={bookingTrends}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.confirmed} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors.confirmed} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.cancelled} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors.cancelled} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="bookings" name="Total Bookings" stroke={colors.primary} fillOpacity={1} fill="url(#colorBookings)" />
              <Area type="monotone" dataKey="confirmed" name="Confirmed" stroke={colors.confirmed} fillOpacity={1} fill="url(#colorConfirmed)" />
              <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke={colors.cancelled} fillOpacity={1} fill="url(#colorCancelled)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Revenue Trend Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-primary mb-6">Revenue Trends (Last 6 Months)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={bookingTrends}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue (IDR)" stroke={colors.success} strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

Statistics.propTypes = {
  token: PropTypes.string.isRequired
};

export default Statistics;
