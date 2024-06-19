import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import '../App.css';

const TableComponent = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState('January');
  const [statistics, setStatistics] = useState({
    totalSalesAmount: 0,
    totalSoldItems: 0,
    totalNotSoldItems: 0,
  });

  const months = moment.months();

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/transactions', {
        params: {
          search,
          page,
          perPage,
          month,
        },
      });
      setProducts(response.data.products);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/statistics/${month}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStatistics();
  }, [search, page, perPage, month]);

  return (
    <div>
      <h2>Product Transactions for {month}</h2>
      <div>
        <label>
          Select Month:
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((monthName) => (
              <option key={monthName} value={monthName}>
                {monthName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          className="search-input"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="statistics">
        <div>Total Sales Amount: {statistics.totalSalesAmount}</div>
        <div>Total Sold Items: {statistics.totalSoldItems}</div>
        <div>Total Not Sold Items: {statistics.totalNotSoldItems}</div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Description</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.title}</td>
              <td>{product.price}</td>
              <td>{product.description}</td>
              <td>{product.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-buttons">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <button
          disabled={page * perPage >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
      <div>
        <label>
          Items per page:
          <select
            value={perPage}
            onChange={(e) => setPerPage(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default TableComponent;
