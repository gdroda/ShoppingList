import { useState, useEffect } from 'react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import './App.css';

ModuleRegistry.registerModules([AllCommunityModule]);

interface User { 
    name: string;
    email: string
}

export default function App() {
    const [userData, setUserData] = useState < User | null > (null);
    const [isLoading, setLoading] = useState(true);

    const [items, setItems] = useState([]);

    useEffect(() => {
        const initiateAuthorization = async () => {

            const checkLoginStatus = async () => {
                try {
                    const resp = await fetch("https://localhost:7262/api/auth/user", {
                        method: "GET",
                        credentials: "include"
                    })
                    if (resp.ok) {
                        const data = await resp.json();
                        setUserData(data);
                    } else {
                        setUserData(null);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                finally {
                    setLoading(false);
                }
            }
            checkLoginStatus();
        }
        initiateAuthorization();
    }, []);


    








    const [rowData, _setRowData] = useState([
        { περιγραφή: "Πράγμα 1", τιμή: 21, ποσότητα: 1 },
        { περιγραφή: "Πράγμα 2", τιμή: 10, ποσότητα: 5},
        { περιγραφή: "Πράγμα 3", τιμή: 2, ποσότητα: 1 },
    ]);

    const [colDefs, _setColDefs] = useState([
        {
            field: "περιγραφή", editable: true, cellEditor: 'agTextCellEditor', flex: 3 },
        {
            field: "ποσότητα", editable: true, cellEditor: 'agNumberCellEditor', flex: 1,
            cellEditorParams: {
                precision: 1,
                step: 1,
                min: 0,
                showStepperButtons: true
            }
        },
        {
            field: "τιμή", editable: true, cellEditor: 'agNumberCellEditor', flex: 1,
            cellEditorParams: {
                precision: 1,
                step: 1,
                min: 0,
                showStepperButtons: true,
                
            }, valueFormatter: p => p.value.toLocaleString() + ' €'
        }
    ]);

    if (isLoading) {
        return <div>Checking authentication...</div>;
    }

    const Login = async () => {
        window.location.href = "https://localhost:7262/api/auth/login";
    }

    const Logout = async () => {
        try {
            const response = await fetch("https://localhost:7262/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });
            if (response.ok) {
                setUserData(null);
                window.location.href = "https://localhost:64099";
            }
        }
        catch (error) {
            console.log("Log out failed.", error);
        }
    }

    if (items) {
        return (
            <>
                <div name="grid" style={{ height: 500 }}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={colDefs}
                    />
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Μανστερ</td>
                            <td>3</td>
                            <td>{(1.22 * 3) + " €"}</td>
                        </tr>
                    </tbody>
                </table>

                <div>
                <button onClick ={() => Login()}>Log in with Google</button>
                    <h2>{userData?.name}, {userData?.email}</h2>
                </div>
            </>
        )
        
    }
}

