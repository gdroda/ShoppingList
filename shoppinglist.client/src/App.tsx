import { useState, useEffect, useRef } from 'react';
import './App.css';


interface User { 
    name: string;
    email: string
}

export default function App() {
    const [userData, setUserData] = useState < User | null > (null);
    const [isLoading, setLoading] = useState(true);

    //const [items, setItems] = useState([]);

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



    


    
    const [items, setItems] = useState([
        { id: Date.now(), checked: false, text: '', qty: '', price: '' }
    ]);

    // To handle auto-focusing the next line
    const inputRefs = useRef([]);

    const updateItem = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItem = { id: Date.now(), checked: false, text: '', qty: '', price: '' };

            // Insert new item after current index
            const newItems = [...items];
            newItems.splice(index + 1, 0, newItem);
            setItems(newItems);

            // Focus the new input on the next render
            setTimeout(() => {
                if (inputRefs.current[index + 1]) {
                    inputRefs.current[index + 1].focus();
                }
            }, 0);
        }

        // Optional: Backspace on empty line deletes the line
        if (e.key === 'Backspace' && items[index].text === '' && items.length > 1) {
            e.preventDefault();
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            // Focus previous line
            if (inputRefs.current[index - 1]) {
                inputRefs.current[index - 1].focus();
            }
        }
    };




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


    /* Set the width of the side navigation to 250px */
    function openNav() {
        document.getElementById("mySidenav").style.width = "250px";
    }

    /* Set the width of the side navigation to 0 */
    function closeNav() {
        document.getElementById("mySidenav").style.width = "0";
    } 


    if (items) {
        return (
            <div>

                <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
                    <h2>My Shopping List</h2>
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #eee',
                                    background: item.checked ? '#f9f9f9' : 'white'
                                }}
                            >
                                {/* 1. The Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={(e) => updateItem(item.id, 'checked', e.target.checked)}
                                    style={{ marginRight: '12px', cursor: 'pointer' }}
                                />

                                {/* 2. The Item Name (The "Textarea" part) */}
                                <input
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    value={item.text}
                                    placeholder="Item name..."
                                    onChange={(e) => updateItem(item.id, 'text', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '16px',
                                        textDecoration: item.checked ? 'line-through' : 'none',
                                        color: item.checked ? '#aaa' : '#333'
                                    }}
                                />

                                {/* 3. The Interpolated Style Inputs (Qty/Price) */}
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input
                                        type="text"
                                        placeholder="Qty"
                                        value={item.qty}
                                        onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                        
                                    />
                                    <input
                                        type="text"
                                        placeholder="$"
                                        value={item.price}
                                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                        
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>





            <div id="mySidenav" className="sidenav">
                    <a className="closebtn" onClick={() => closeNav()}>&times;</a>
                    <a href="#">About</a>
                    <a href="#">Services</a>
                    <a href="#">Clients</a>
                    <a href="#">Contact</a>
                </div>

                <span onClick={() => openNav()}>open</span>

                <div id="main">
                </div>

                <div>
                    <button onClick={() => Login()}>Log in with Google</button>
                    <h2>{userData?.name}, {userData?.email}</h2>
                </div>
            </div>
        )
        
    }
}

