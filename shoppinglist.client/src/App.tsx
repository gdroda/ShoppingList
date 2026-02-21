import { useState, useEffect } from 'react';
import './App.css';


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



    


    
    const [inputText, setInputText] = useState('');

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInputText(newValue);

        const lines = newValue.split('\n');
        //const cleanLines = lines.filter(line => line.trim() !== '');
    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const lines = inputText.split('\n');
            let latestLine = lines[lines.length - 1];
            const words = latestLine.split(' ');
            for (let i = 0; i < words.length ;i++) {
                if (!isNaN(words[i])) {
                    if (i > 0) {
                        let temp = words[i - 1];
                        words[i - 1] = words[i];
                        words[i] = temp;
                        latestLine = words.join(' ');
                        lines[lines.length - 1] = latestLine;
                        setInputText(lines.join("\n"))
                    }
                }
            }
        }
    };

    const parsedItems = inputText.split('\n').filter(line => line.trim() !== '');


    const reverseOrder = (inputString) => {

    }






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
            <div style={{ fontFamily: 'sans-serif', maxWidth: '400px', margin: '20px auto' }}>
                <h2>Add Shopping Items</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>Enter one item per line.</p>

                <textarea
                    value={inputText}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={8}
                    style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                    placeholder="Apples&#10;Bananas&#10;Milk"
                />

                <div style={{ marginTop: '20px' }}>
                    <h3>Parsed Items ({parsedItems.length}):</h3>
                    <ul>
                        {parsedItems.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <button onClick={() => Login()}>Log in with Google</button>
                    <h2>{userData?.name}, {userData?.email}</h2>
                </div>
            </div>

        )
        
    }
}

