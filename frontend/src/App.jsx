import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PatientHome from "./pages/PatientHome";
import DoctorHome from "./pages/DoctorHome";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";
import LanguageSwitcher from "./components/LanguageSwitcher";


function App() {
  return (
    <BrowserRouter>
      <LanguageSwitcher />

      <Routes>

        {/* <Route path="/" element={<Login />} /> */}
        <Route path="/" element={<Login />} />

        <Route
          path="/patient"
          element={
            <PatientHome />
            // <PrivateRoute role="patient">
            //   <PatientHome />
            // </PrivateRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <Chat />
            // <PrivateRoute role="patient">
            //   <Chat />
            // </PrivateRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <DoctorHome />
            // <PrivateRoute role="doctor">
            //   <DoctorHome />
            // </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
