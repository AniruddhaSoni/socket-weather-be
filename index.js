const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const http = require("http");

const app = express();
const PORT = 3001;

const server = http.createServer(app);

const io = new socketIo.Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");
});

async function fetchWeatherData({ longitude, latitude }) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API_KEY}&units=metric`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    return {
      location: data.name + ", " + data.sys.country,
      temperature: data.main.temp,
      conditions: data.weather[0].id,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      rain: data.rain ? data.rain["1h"] : 0,
    };
  } catch (error) {
    console.error(error);
    return {
      temperature: null,
      conditions: null,
    };
  }
}

function sendDataToClient(data) {
  setInterval(() => {
    io.emit("messageFromServer", data);
  }, 30000);
}

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

// API endpoint for weather data
app.post("/api/weather", async (req, res) => {
  const { longitude, latitude } = req.body;

  const weatherData = await fetchWeatherData({ longitude, latitude });

  sendDataToClient(weatherData);

  res.json({
    weatherData,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
