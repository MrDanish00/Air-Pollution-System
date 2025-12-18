# 🌍 Smart Air Pollution Monitoring System

Real-time air quality monitoring and forecasting system using Django, React, and Machine Learning.

## 📸 Screenshots

![Dashboard](screenshots/dashboard.png)

## 🌟 Features

- ✅ Real-time AQI data from OpenWeather API
- ✅ Support for cities worldwide
- ✅ Historical trends and analytics
- ✅ 7-day ML-powered forecasts
- ✅ Health advisories based on AQI levels
- ✅ Beautiful responsive UI

## 🛠️ Tech Stack

### Backend
- Django REST Framework
- Python 3.8+
- MySQL/SQLite
- OpenWeather API

### Frontend
- React 18
- Tailwind CSS
- Recharts for data visualization
- Lucide React icons

### Machine Learning
- Scikit-learn (Random Forest)
- Pandas & NumPy
- Time-series forecasting

## 📋 Installation

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Create `backend/.env`:
```
OPENWEATHER_API_KEY=your_api_key_here
```

## 🎓 Project Information

**Course:** Data Science Program  
**University:** Institute of Data Science, UET Lahore  
**Semester:** Fall 2024  

### Team Members
- **Abdullah Amjad** (2024-DS-37)
- **Syed Muhammad Fahad** (2024-DS-46)
- **Muhammad Danish** (2024-DS-54)

## 📊 Concepts Integrated

- ✅ Software Engineering (MVC, REST API, Agile)
- ✅ Database Systems (MySQL, Normalization, Indexing)
- ✅ Data Structures & Algorithms (Queues, Heaps, Sorting)
- ✅ Machine Learning (Random Forest, Time-series)
- ✅ Computer Networks (HTTP, API Integration)

## 📄 License

Academic Project © 2024 - UET Lahore

## 🙏 Acknowledgments

- OpenWeather API for pollution data
- UET Lahore Data Science Faculty
- Open-source community
