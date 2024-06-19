const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors')
const bodyParser = require('body-parser');
const moment = require('moment');

const app = express();
app.use(cors())
const port = 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/productsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Define the Product schema and model
const productSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date,
});

const Product = mongoose.model('Product', productSchema);

// Use body-parser middleware
app.use(bodyParser.json());

// Endpoint to initialize the database
app.get('/initialize', async (req, res) => {
  try {
    const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');

    console.log(`Fetched ${data.length} items from the API`);

    // Clear existing data
    await Product.deleteMany({});

    // Insert new data
    const result = await Product.insertMany(data);
    console.log(`Inserted ${result.length} items into the database`);

    res.send('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    res.status(500).send('Error initializing database.');
  }
});

// Endpoint to fetch products sold in a specific month
app.get('/products/:month', async (req, res) => {
  const month = req.params.month;
  const monthNumber = moment().month(month).format("M");

  if (!monthNumber) {
    return res.status(400).send('Invalid month');
  }

  try {
    const products = await Product.aggregate([
      {
        $addFields: {
          monthOfSale: { $month: "$dateOfSale" }
        }
      },
      {
        $match: {
          monthOfSale: parseInt(monthNumber, 10)
        }
      }
    ]);

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products.');
  }
});

// GET endpoint to fetch all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products.');
  }
});

// GET endpoint to list all transactions with search and pagination
app.get('/transactions', async (req, res) => {
  const { search = '', page = 1, perPage = 10 } = req.query;
  const searchRegex = new RegExp(search, 'i');

  try {
    const query = search
      ? {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { price: { $regex: searchRegex } },
          ],
        }
      : {};

    const products = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));

    const total = await Product.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      products,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).send('Error fetching transactions.');
  }
});

// GET endpoint for statistics
app.get('/statistics/:month', async (req, res) => {
  const month = req.params.month;
  const monthNumber = moment().month(month).format("M");

  if (!monthNumber) {
    return res.status(400).send('Invalid month');
  }

  try {
    const stats = await Product.aggregate([
      {
        $addFields: {
          monthOfSale: { $month: "$dateOfSale" }
        }
      },
      {
        $match: {
          monthOfSale: parseInt(monthNumber, 10)
        }
      },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: "$price" },
          totalSoldItems: { $sum: { $cond: ["$sold", 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: ["$sold", 0, 1] } },
        }
      }
    ]);

    const result = stats[0] || {
      totalSalesAmount: 0,
      totalSoldItems: 0,
      totalNotSoldItems: 0,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).send('Error fetching statistics.');
  }
});

// GET endpoint for bar chart data
app.get('/barchart/:month', async (req, res) => {
  const month = req.params.month;
  const monthNumber = moment().month(month).format("M");

  if (!monthNumber) {
    return res.status(400).send('Invalid month');
  }

  try {
    const priceRanges = [
      { range: "0-100", min: 0, max: 100 },
      { range: "101-200", min: 101, max: 200 },
      { range: "201-300", min: 201, max: 300 },
      { range: "301-400", min: 301, max: 400 },
      { range: "401-500", min: 401, max: 500 },
      { range: "501-600", min: 501, max: 600 },
      { range: "601-700", min: 601, max: 700 },
      { range: "701-800", min: 701, max: 800 },
      { range: "801-900", min: 801, max: 900 },
      { range: "901-above", min: 901, max: Infinity }
    ];

    const boundaries = priceRanges.map(range => range.min).concat([Infinity]);

    const aggregationPipeline = [
      {
        $addFields: {
          monthOfSale: { $month: "$dateOfSale" }
        }
      },
      {
        $match: {
          monthOfSale: parseInt(monthNumber, 10)
        }
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: boundaries,
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ];

    const data = await Product.aggregate(aggregationPipeline);

    const barChartData = priceRanges.map((range, index) => {
      const matchingBucket = data.find((bucket) => {
        if (index === priceRanges.length - 1) {
          return bucket._id === Infinity;
        } else {
          return bucket._id === range.min;
        }
      });
      return {
        range: range.range,
        count: matchingBucket ? matchingBucket.count : 0
      };
    });

    res.json(barChartData);
  } catch (error) {
    console.error('Error fetching bar chart data:', error.message);
    res.status(500).send('Error fetching bar chart data.');
  }
});

// GET endpoint for pie chart data
app.get('/piechart/:month', async (req, res) => {
  const month = req.params.month;
  const monthNumber = moment().month(month).format("M");

  if (!monthNumber) {
    return res.status(400).send('Invalid month');
  }

  try {
    const aggregationPipeline = [
      {
        $addFields: {
          monthOfSale: { $month: "$dateOfSale" }
        }
      },
      {
        $match: {
          monthOfSale: parseInt(monthNumber, 10)
        }
      },
      {
        $group: {
          _id: "$category",
          itemCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          itemCount: 1
        }
      }
    ];

    const data = await Product.aggregate(aggregationPipeline);

    res.json(data);
  } catch (error) {
    console.error('Error fetching pie chart data:', error.message);
    res.status(500).send('Error fetching pie chart data.');
  }
});
app.get('/combined/:month', async (req, res) => {
    const month = req.params.month;
  
    try {
      const [barChartResponse, pieChartResponse, statisticsResponse] = await Promise.all([
        axios.get(`http://localhost:3000/barchart/${month}`),
        axios.get(`http://localhost:3000/piechart/${month}`),
        axios.get(`http://localhost:3000/statistics/${month}`)
      ]);
  
      const combinedResponse = {
        barChart: barChartResponse.data,
        pieChart: pieChartResponse.data,
        statistics: statisticsResponse.data
      };
  
      res.json(combinedResponse);
    } catch (error) {
      console.error('Error fetching combined data:', error.message);
      res.status(500).send('Error fetching combined data.');
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});