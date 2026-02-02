import { StrictMode, useState } from 'react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import './App.css';

ModuleRegistry.registerModules([AllCommunityModule]);

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

    // Row Data: The data to be displayed.
    const [rowData, _setRowData] = useState([
        { περιγραφή: "Πράγμα 1", τιμή: 21, ποσότητα: 1 },
        { περιγραφή: "Πράγμα 2", τιμή: 10, ποσότητα: 5},
        { περιγραφή: "Πράγμα 3", τιμή: 2, ποσότητα: 1 },
    ]);

    // Column Definitions: Defines the columns to be displayed.
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
                <button className="APIButton" onClick={handleClick}>APIButton</button>
            <ul>
                {items.map(item => (<li key={item.id}>{item.title}</li>)) }
                </ul>
            </>
        )
        
    }
}



export default App;