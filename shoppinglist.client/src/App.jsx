import { useState } from 'react';
import './App.css';


function App() {
    const [items, setItems] = useState([]);

    const handleClick = async () => {
        try {
            const data = await (await fetch(`https://localhost:7262/api/shoplist/`)).json()
            setItems(data)
        } catch (err) {
            console.log(err.message)
        }
    }
    if (items) {
        return (
            <>
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
                <button className="APIButton" onClick={handleClick}>APIButton</button>
            <ul>
                {items.map(item => (<li key={item.id}>{item.title}</li>)) }
                </ul>
            </>
        )
        
    }
}



export default App;