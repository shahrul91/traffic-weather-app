import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import TimePicker from "react-time-picker";
import axios from "axios";

import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "./App.css"; 

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };
  const [selectedTime, setSelectedTime] = useState<string | null>(
    getCurrentTime()
  );
  const [selectedTimeDate, setSelectedTimeDate] = useState<string | null>(null);
  const [locationsAndWeather, setLocationsAndWeather] = useState<any>();
  const [screenshot, setScreenshot] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [filteredForecasts, setFilteredForecasts] = useState<string[] | null>(
    null
  );
  const [filteredScreenshot, setFilteredScreenshot] = useState<any>();
  const [latitudeLoc, setLatitudeLoc] = useState<any>();
  const [longitudeLoc, setLongitudeLoc] = useState<any>();

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const formattedDateTime = `${selectedDate
        .toISOString()
        .slice(0, 10)}T${selectedTime}:00`;
      setSelectedTimeDate(formattedDateTime);


      axios
        .get(
          `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=${formattedDateTime}&date=${selectedDate
            .toISOString()
            .slice(0, 10)}`
        )
        .then((response) => {
          setLocationsAndWeather(response.data);
        })
        .catch((error) => {
          console.error("API Error:", error);
        });


      axios
        .get(
          `https://api.data.gov.sg/v1/transport/traffic-images?date_time=${formattedDateTime}`
        )
        .then((response) => {
          setScreenshot(response.data);
        })
        .catch((error) => {
          console.error("Screenshot API Error:", error);
        });
    }
  }, [selectedDate, selectedTime]);

  const handleLocationClick = (
    locationName: string,
    longitude: any,
    latitude: any
  ) => {
    setSelectedLocation(locationName);
    setLatitudeLoc(latitude);
    setLongitudeLoc(longitude);
  };

  useEffect(() => {
    if (selectedLocation && locationsAndWeather && locationsAndWeather.items) {
      const selectedLocationForecasts =
        locationsAndWeather.items[0]?.forecasts.filter((forecast: any) => {
          return forecast.area === selectedLocation;
        });
      setFilteredForecasts(
        selectedLocationForecasts.map((forecast: any) => forecast.forecast)
      );
    }
  }, [selectedLocation, locationsAndWeather]);

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const radLat1 = (Math.PI * lat1) / 180;
    const radLat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radTheta = (Math.PI * theta) / 180;
    let dist =
      Math.sin(radLat1) * Math.sin(radLat2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist;
  }
  useEffect(() => {
    if (
      selectedLocation &&
      latitudeLoc &&
      longitudeLoc &&
      screenshot &&
      screenshot.items
    ) {
      const selectedLocationScreenshot = screenshot.items[0]?.cameras
        .map((camera: any) => {
          const distance = calculateDistance(
            latitudeLoc,
            longitudeLoc,
            camera.location.latitude,
            camera.location.longitude
          );
          return { camera, distance };
        })
        .sort(
          (a: { distance: number }, b: { distance: number }) =>
            a.distance - b.distance
        )
        .map((item: { camera: any }) => item.camera);
      setFilteredScreenshot(selectedLocationScreenshot[0]);
    }
  }, [selectedLocation, screenshot, latitudeLoc, longitudeLoc]);

  return (
    <div className="app-container">
      <header>
        <h1>Traffic Weather Forecast App</h1>
      </header>
      <div className="date-time-row">
        <div className="react-datepicker">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
          />
        </div>
        <div className="time-picker">
          <TimePicker value={selectedTime} onChange={setSelectedTime} />
        </div>
      </div>
      <div className="row">
        <div
          className="locations-weather-row"
          style={{ height: "200px", overflowY: "scroll" }}
        >
          {locationsAndWeather?.area_metadata.map(
            (item: any, index: number) => (
              <div
                key={index}
                onClick={() =>
                  handleLocationClick(
                    item.name,
                    item.label_location.longitude,
                    item.label_location.latitude
                  )
                }
                className={selectedLocation === item.name ? "selected" : ""}
              >
                {item.name}
              </div>
            )
          )}
        </div>
        <div className="weather-row">
          {filteredForecasts && (
            <div className="weather-forecasts">
              {filteredForecasts.map((item: string, index: number) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="row">
      <div className="screenshot-row">
        {filteredScreenshot && (
          <img
            src={filteredScreenshot.image}
            alt="Screenshot"
            className="screenshot-image"
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default App;
