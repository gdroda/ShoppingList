import { useEffect, useState } from 'react';
import './App.css';


    const App = () => {
        const [items, setItems] = useState([]);

        useEffect(() => {
            fetch('https://localhost:7262/api/shoplist/')
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw response;
                },
                )
                .then((data) => {
                    setItems(data);
                });
        });

        return (
            <ul>
                {items.map(item => (<li key={item.id}>{item.title}</li>) )}
            </ul>
        );
    };


export default App;