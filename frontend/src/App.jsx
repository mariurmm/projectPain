import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PatientHome from "./pages/PatientHome";
import DoctorHome from "./pages/DoctorHome";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/patient"
          element={
            <PrivateRoute role="patient">
              <PatientHome />
            </PrivateRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <PrivateRoute role="patient">
              <Chat />
            </PrivateRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <PrivateRoute role="doctor">
              <DoctorHome />
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
