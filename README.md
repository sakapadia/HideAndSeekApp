# Hide and Seek - Noise Reporting Application

A modern web application for reporting and tracking noise complaints in your community. Built with React frontend and ASP.NET Core backend, featuring interactive Google Maps integration and Azure Table Storage.

## 🌟 Features

- **Interactive Map View**: View noise reports on an interactive Google Maps interface
- **Multi-step Reporting**: User-friendly form flow for submitting noise complaints
- **User Authentication**: Login with Gmail, Facebook, or continue as guest
- **Real-time Updates**: Reports update every 15 minutes on the map
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Azure Integration**: Scalable cloud storage with Azure Table Storage

## 🏗️ Architecture

- **Frontend**: React with Vite
- **Backend**: ASP.NET Core Web API
- **Database**: Azure Table Storage
- **Maps**: Google Maps JavaScript API
- **Styling**: Custom CSS with modern design

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- .NET 8.0 SDK
- Azure Storage Emulator (for local development)
- Google Maps API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hideandseek.git
   cd hideandseek
   ```

2. **Set up the Frontend**
   ```bash
   cd hideandseek.client
   npm install
   ```

3. **Configure Google Maps API**
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Maps JavaScript API" and "Geocoding API"
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` in `src/App.jsx`

4. **Set up the Backend**
   ```bash
   cd ../HideandSeek.Server
   dotnet restore
   ```

5. **Configure Azure Storage**
   - Install Azure Storage Emulator or Azurite
   - Update connection string in `appsettings.json` if needed

### Running the Application

1. **Start the Backend**
   ```bash
   cd HideandSeek.Server
   dotnet run
   ```

2. **Start the Frontend**
   ```bash
   cd hideandseek.client
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173 (or the port shown in terminal)
   - Backend API: https://localhost:7001
   - Swagger Docs: https://localhost:7001/swagger

## 📱 Usage

### For Users

1. **First Time**: Login with Gmail, Facebook, or continue as guest
2. **Main Menu**: Choose between "Create a Report" or "View Map"
3. **Create Report**: Follow the multi-step form to submit a noise complaint
4. **View Map**: See all noise reports in your area on an interactive map

### For Developers

- **Frontend Development**: `npm run dev` in `hideandseek.client`
- **Backend Development**: `dotnet run` in `HideandSeek.Server`
- **API Testing**: Use Swagger UI at `/swagger`

## 🗂️ Project Structure

```
HideandSeek/
├── hideandseek.client/          # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
├── HideandSeek.Server/          # ASP.NET Core backend
│   ├── Controllers/            # API controllers
│   ├── Models/                 # Data models
│   ├── Services/               # Business logic
│   └── Program.cs              # Application entry point
└── README.md
```

## 🔧 Configuration

### Environment Variables

- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `AzureStorage:ConnectionString`: Azure Storage connection string
- `AzureStorage:TableName`: Table name for noise reports

### API Endpoints

- `GET /api/noisereports` - Get noise reports within bounds
- `POST /api/noisereports` - Submit a new noise report
- `GET /api/noisereports/zipcodes` - Get ZIP codes within bounds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Maps API for mapping functionality
- Azure for cloud storage solutions
- React and ASP.NET Core communities for excellent documentation

## 📞 Support

For support, email support@hideandseek.com or create an issue in this repository. 