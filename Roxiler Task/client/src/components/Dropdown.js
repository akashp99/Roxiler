import React from 'react';

const Dropdown = ({ months, selectedMonth, setSelectedMonth }) => {
  const handleChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  return (
    <div>
      <label>Select Month:</label>
      <select value={selectedMonth} onChange={handleChange}>
        {months.map((month, index) => (
          <option key={index} value={month}>{month}</option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
