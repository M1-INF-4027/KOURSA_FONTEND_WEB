import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import NotFound from "./views/notFound.jsx";
import AdminUser from "./views/admin/adminUser.jsx";
import AdminDepartement from "./views/admin/adminDepartement.jsx";
import AdminSetting from "./views/admin/adminSetting.jsx";
import AdminLogin from "./views/admin/adminLogin.jsx";
import AuthGard from "./auth/authGard.jsx";
import AdminLayout from "./auth/adminLayout.jsx";

function App() {
    const [role, setRole] = useState("admin");
    const [isAuth, setIsAuth] = useState(true);
    if (role === "admin" && isAuth) {
        return (
                <Router>
                    <Routes>
                        {/* PUBLIC */}
                        <Route path={'/admin/login'} element={<AdminLogin/>}/>
                        <Route path="*" element={<NotFound />} />


                        {/* PRIVATE */}

                        <Route path={'/admin'} element={<AuthGard isAuth={isAuth}><AdminLayout/></AuthGard>}>
                            <Route path={'departements'} element={<AdminDepartement/>} />
                            <Route path={'utilisateurs'} element={<AdminUser/>}/>
                            <Route path={'parametre'} element={<AdminSetting/>}/>
                        </Route>
                    </Routes>
                </Router>
        )
    }

  return (
    <>
    </>
  )
}

export default App
