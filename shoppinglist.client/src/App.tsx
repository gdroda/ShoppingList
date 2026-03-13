import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Button } from '@/components/ui/button.js';
import { Sidebar, SidebarTrigger, SidebarProvider, useSidebar, SidebarInset } from '@/components/ui/sidebar.js';
import { Input } from '@/components/ui/input.js';
import { useDebounce } from './debounce.tsx';
import { NameModal } from './RenameModal.js';

interface User { 
    name: string;
    email: string
}


export function CustomTrigger({
    className,
    onClick,
    children,
    ...props
}: React.ComponentProps<typeof Button>) {
    const { toggleSidebar } = useSidebar()

    return <Button
        className={className}
        onClick={(event) => {
            onClick?.(event)
            toggleSidebar()
        }}
        {...props }
    >{children}</Button>
}


export default function App() {
    const [userData, setUserData] = useState < User | null > (null);
    const [isLoading, setLoading] = useState(true);
    const [listId, setListId] = useState();
    const [listTitle, setListTitle] = useState();
    const [userLists, setUserLists] = useState([]);

    const [items, setItems] = useState([
        { id: Date.now(), isChecked: false, name: '', quantity: '', price: '' }
    ]);

    const debouncedSave = useDebounce(items, 1000)



    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const handleNameSubmit = async (newName: string) => {
        try {
            const response = await fetch(`https://localhost:7262/api/shoplist/rename/${listId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Title: newName })
            });
            if (response.ok) {
                console.log("List Renamed Successfully.");
                LoadLists();
            }
        }
        catch (error) {
            console.log("Rename list failed.", error);
        }
        setIsRenameOpen(false);
    }



    const inputRefs = useRef([]);


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

                LoadLists();
            }
            checkLoginStatus();
        }
        initiateAuthorization();
    }, []);


    const LoadLists = async () => {
        try {
            const resp = await fetch("https://localhost:7262/api/shoplist", {
                method: "GET",
                credentials: "include"
            })
            if (resp.ok) {
                const data = await resp.json();
                setUserLists(data)
            } else {
                setUserLists(null);
            }
        }
        catch (error) {
            console.log(error);
        }
    }



    useEffect(() => {
        if (!isLoading) {
            LoadList(userLists[0].id)
        }
    }, [userLists])

    const LoadList = (id) => {
        const getList = async () => {
            try {
                const resp = await fetch(`https://localhost:7262/api/shoplist/${id}`, {
                    method: "GET",
                    credentials: "include"
                })
                if (resp.ok) {
                    const data = await resp.json();
                    setListId(data.id);
                    setListTitle(data.title);
                    const safeData = Array.isArray(data.listedItems) ? data.listedItems : (data.listedItems?.items || []);
                    const mappedItems = safeData.map((itemDB: any, index: number) => ({
                        id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,  //temp for unique ID
                        name: itemDB.name || '',
                        quantity: itemDB.quantity || '',
                        price: itemDB.price || '',
                        isChecked: false
                    }));
                    const emptyRow = {
                        id: Date.now(),
                        name: '',
                        quantity: '',
                        price: '',
                        isChecked: false
                    }
                    setItems([...mappedItems, emptyRow]);

                }
            }
            catch (error) {
                console.log(error);
            }
        }
        getList();
    };





    interface ItemToSend {
        Name: string,
        Price: number,
        Quantity: number,
        IsChecked: boolean
    }

    const SaveList = async () => {
        try {
            const payload: ItemToSend[] = items.filter(item => item.name && item.name.trim() !== "").map(item => ({
                Name: item.name,
                Price: Number(item.price) || 0,
                Quantity: Number(item.quantity) || 0,
                IsChecked: item.isChecked
            }));
            const response = await fetch(`https://localhost:7262/api/shoplist/${listId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                console.log("List Saved Successfully.");
            }
        }
        catch (error) {
            console.log("Create list failed.", error);
        }
    }
    

    useEffect(() => {
        if (debouncedSave && !isLoading) {
            SaveList();
        }
    }, [debouncedSave])







    const updateItem = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItem = { id: Date.now(), isChecked: false, name: '', quantity: '', price: '' };

            const newItems = [...items];
            newItems.splice(index + 1, 0, newItem);
            setItems(newItems);

            // Focus the new input on the next render
            setTimeout(() => {
                if (inputRefs.current[index + 1]) {
                    inputRefs.current[index + 1].focus();
                }
            }, 10);
        }

        

        if (e.key === 'Backspace' && items[index].name === '' && items.length > 1) {
            e.preventDefault();
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            // Focus previous line
            if (inputRefs.current[index - 1]) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handleChange = (e, index) => {
        console.log(items[index].name.length)
        if (items[index].name.length === 1 && items.length <= 1) {
            items[index].quantity = '';
            items[index].price = '';
        }
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

    const CreateList = async () => {
        try {
            const payload = {
                Title: "Testlist"
            }
            const response = await fetch('https://localhost:7262/api/shoplist/', {
                method: "POST",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                console.log("List Created Successfully.");
            }
        }
        catch (error) {
            console.log("Create list failed.", error);
        }
    }



    

    const DeleteList = async () => {
        try {
            const response = await fetch(`https://localhost:7262/api/shoplist/${listId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (response.ok) {
                console.log("Successfully deleted.");
            }
        }
        catch (error) {
            console.log("Delete list failed.", error);
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
                
                

                <SidebarProvider className='flex'>
                    <SidebarInset>





                        <SidebarTrigger />
                        <div className="w-full">
                            <div className="flex flex-row md:flex justify-start gap-25 p-1">
                                <h2>{listId? listTitle : "Temporary List"}</h2>
                                <Button onClick={() => setIsRenameOpen(true) }>Rename</Button>
                            </div>
                            
                            <div className="flex flex-col md:flex-col items-center py-10 " >
                                {items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`flex flex-row md:flex-row items-center gap-1 p-0.5 
                                ${item.isChecked ? `line-through text-gray-400 bg-gray-50` : `text-gray-900`}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={item.isChecked}
                                            onChange={(e) => updateItem(item.id, 'isChecked', e.target.checked)}
                                            className="w-1/8"
                                        />
                                        <input
                                            ref={el => { if (el) { inputRefs.current[index] = el; } else { delete inputRefs.current[index] } }}
                                            type="text"
                                            value={item.name}
                                            placeholder="Item name..."
                                            spellCheck="false"
                                            onChange={(e) => { updateItem(item.id, 'name', e.target.value); handleChange(e, index); }}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            enterKeyHint="enter"
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Qty"
                                            maxLength="2"
                                            inputMode="decimal"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Tab' && e.key !== 'Backspace') { e.preventDefault(); }
                                                handleKeyDown(e, index)
                                            }}
                                            className="w-1/8 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"

                                        />
                                        <input
                                            type="text"
                                            maxLength="2"
                                            placeholder="$"
                                            value={item.price}
                                            inputMode="decimal"
                                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') { e.preventDefault(); }
                                                handleKeyDown(e, index)
                                            }}
                                            className="w-1/8 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"

                                        />
                                    </div>
                                ))}
                            </div>
                        </div>



                        <div>
                            <Button onClick={() => CreateList()}>Create List</Button>
                            <Button onClick={() => DeleteList()}>Delete List</Button>
                        </div>



                        <div>
                            <button onClick={() => Login()}>Log in with Google</button>
                            <h2>{userData?.name}, {userData?.email}</h2>
                        </div>
                        <div>
                            <button onClick={() => Logout()}>Log out</button>
                        </div>





                        </SidebarInset>
                        <Sidebar>
                            <main>
                            <SidebarTrigger className="flex items-end"/>
                            <ul className="list-disc pl-5 space-y-2">
                                {userLists.map((list) => (
                                    <li key={list.id}>
                                        <CustomTrigger children={list.title } onClick={() => LoadList(list.id)}></CustomTrigger>
                                    </li>
                                )) }
                            </ul>
                            </main>
                        </Sidebar>
                    </SidebarProvider>

                <NameModal
                    isOpen={isRenameOpen}
                    onClose={() => setIsRenameOpen(false)}
                    onSubmit={handleNameSubmit }
                />
            </div>
        )
        
    }
}

