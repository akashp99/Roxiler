import React, { useState } from 'react';
import Dropdown from './components/Dropdown';
import BarChartComponent from './components/BarChartComponent';
import TableComponent from './components/TableComponent';
import './App.css'; 

const App = () => {
  const [selectedMonth, setSelectedMonth] = useState('January');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="container">
      <h1>Product Transactions Dashboard</h1>
      <Dropdown
        months={months}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />
      <BarChartComponent selectedMonth={selectedMonth} />
      <TableComponent />
    </div>
  );
};

export default App;
