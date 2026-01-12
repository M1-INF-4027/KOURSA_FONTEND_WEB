import {Navigate, Outlet} from "react-router-dom";

function AuthGard({isAuth}) {
    if (!isAuth){
        return (<Navigate to="/admin/login" replace></Navigate>)
    }
    return <Outlet></Outlet>
}
export default AuthGard