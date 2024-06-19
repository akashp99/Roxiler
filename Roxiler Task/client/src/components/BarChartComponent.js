import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart, CategoryScale, LinearScale, Title, Tooltip, BarElement, BarController } from 'chart.js';
import 'chartjs-adapter-moment';
import { Bar } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, Title, Tooltip, BarElement, BarController);

const BarChartComponent = ({ selectedMonth }) => {
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/barchart/${selectedMonth}`);
        const data = response.data;

        if (!data || data.length === 0) {
          console.error('No data fetched');
          return;
        }

        const priceRanges = data.map(item => item.range);
        const counts = data.map(item => item.count);

        const chartData = {
          labels: priceRanges,
          datasets: [
            {
              label: 'Number of Items',
              data: counts,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 5,
            },
          ],
        };

        setChartData(chartData);
      } catch (error) {
        console.error('Error fetching bar chart data:', error.message);
      }
    };

    fetchChartData();
  }, [selectedMonth]);

  return (
    <div>
      <h2>Bar Chart for {selectedMonth}</h2>
      <div className="chart-container">
        {chartData.labels && chartData.labels.length > 0 ? (
          <Bar
            data={chartData}
            options={{
              maintainAspectRatio: false,
              scales: {
                x: {
                  type: 'category',
                  title: {
                    display: true,
                    text: 'Price Range',
                  },
                },
                y: {
                  type: 'linear',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Items',
                  },
                },
              },
            }}
          />
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};

export default BarChartComponent;
