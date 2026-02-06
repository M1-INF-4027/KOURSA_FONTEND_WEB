import AdminNavbar from "../views/admin/adminNavbar.jsx";
import {Outlet} from "react-router-dom";

function AdminLayout() {
    return (
        <>
            <AdminNavbar/>
            <Outlet/>
        </>
    )
}

export default AdminLayout