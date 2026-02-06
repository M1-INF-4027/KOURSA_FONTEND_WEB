import {Link} from "react-router-dom";

function AdminNavbar() {
    return (<>
        <nav>
            <Link to={'/admin/departements'}> départements</Link>
            <Link to={'/admin/utilisateurs'}>utilisateurs</Link>
            <Link to={'/admin/parametre'}>parametre</Link>
        </nav>
    </>)
}
export default AdminNavbar;