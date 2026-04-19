/// <reference types="vite/client" />
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Button } from '@/components/ui/button.js';
import { Sidebar, SidebarTrigger, SidebarProvider, useSidebar, SidebarInset } from '@/components/ui/sidebar.js';
import { useDebounce } from './debounce.tsx';
import { NameModal, ShareModal } from './Modals.js';
import { ConfirmModal } from './ConfirmModal.js';
import { useNotificationSocket } from './SignalRNotifications.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface User { 
    name: string;
    email: string
}

interface List {
    id: number,
    title: string
}

interface Item {
    id: number,
    isChecked: false,
    name: string,
    quantity: string,
    price: string
}

//CUSTOM TRIGGER FOR SIDEBAR BUTTON
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
            {...props}
        >{children}</Button>
}


export default function App() {
    //const [userData, setUserData] = useState < User | null > (null);   REPLACED
    //const [isLoadings, setLoading] = useState(true);   NOT USED
    const [isGuest, setIsGuest] = useState(true);
    const [listId, setListId] = useState<number | null>();
    const [listTitle, setListTitle] = useState();
    const [userLists, setUserLists] = useState([]);

    // REPLACED
    //const [items, setItems] = useState([
    //    { id: Date.now(), isChecked: false, name: '', quantity: '', price: '' }
    //]);

    const [items, setItems] = useState<Item[]>([]);

    const debouncedSave = useDebounce(items, 500)
    const [needSave, setNeedSave] = useState(false);

    useNotificationSocket(listId, debouncedSave);
    const queryClient = useQueryClient();

    //MODALS
    //RENAMING SUBMIT
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const handleNameSubmit = async (newName: string) => {
        try {
            const response = await fetch(`/api/shoplist/rename/${listId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Title: newName })
            });
            if (response.ok) {
                console.log("List Renamed Successfully.");
                allListRefetch();
                loadListRefetch();
            }
        }
        catch (error) {
            console.log("Rename list failed.", error);
        }
        setIsRenameOpen(false);
    }

    //CONFIRMATION SUBMIT
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [listIdToDelete, setListIdToDelete] = useState<number | null>();
    const handleConfirmSubmit = async (listId: number) => {
        await DeleteList(listId);
        setIsConfirmOpen(false);
    }

    //SHARING SUBMIT
    const [isShareOpen, setIsShareOpen] = useState(false);
    const handleShareSubmit = async (email: string) => {
        setIsShareOpen(false);
    }


    const inputRefs = useRef([]);




    


    //TO BE REPLACED
    //USER FETCH AND AUTHORIZATION
    /*useEffect(() => {
        const initiateAuthorization = async () => {
            //UserSetting();
            /*const checkLoginStatus = async () => {
                try {
                    const resp = await fetch(`/api/auth/user`, {
                        method: "GET",
                        credentials: "include"
                    })
                    if (resp.ok) {
                        const data = await resp.json();
                        setUserData(data);
                        setIsGuest(false);
                    } else {
                        setUserData(null);
                        setIsGuest(true);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                finally {
                    setLoading(false);
                }
            }
            checkLoginStatus();/
        }
        initiateAuthorization();
    }, []); */


    

    //LIST LOADING
    const loadAllLists = async (): Promise<List[]> => {
        try {
            const resp = await fetch(`/api/shoplist`, {
                method: "GET",
                credentials: "include"
            })
            const data = await resp.json();
            if (data[0] != null) {
                setListId(listId ? listId : data[0].id);
            } else {
                CreateList();
                return;
            }
            return data;
        }
        catch (error) {
            console.log(error);
        }
    }


    const loadList = async (id): Promise<Item[]> => {
        try {
            const resp = await fetch(`/api/shoplist/${id}`, {
                method: "GET",
                credentials: "include"
            })

            const emptyRow: Item = {
                id: Date.now(),
                name: '',
                quantity: '',
                price: '',
                isChecked: false
            }

            const data = await resp.json();
            
            setListId(data.id);
            setListTitle(data.title);

            const safeData = Array.isArray(data.listedItems) ? data.listedItems : (data.listedItems?.items || []);
            const mappedItems = safeData.map((itemDB: any, index: number) => ({
                id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,  //temp for unique ID
                name: itemDB.name || '',
                quantity: itemDB.quantity || '',
                price: itemDB.price || '',
                isChecked: itemDB.isChecked || false
            }));
            

            if ([...mappedItems].length > 0) {
                setItems([...mappedItems]);
                const list: Item[] = [...mappedItems];
                return list;
            }
            else {
                setItems([...mappedItems, emptyRow]);
                const list: Item[] = [...mappedItems, emptyRow];
                return list;
            }
        }
        catch (error) {
            console.log(error);
        }
    }





    // SAVE FUNCTION AND DEBOUNCE
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
            const response = await fetch(`/api/shoplist/${listId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }
        catch (error) {
            console.log("List Save Failed.", error);
        }
    }
    

    useEffect(() => {
        if (debouncedSave && !isGuest && needSave) {
            SaveList();
            setNeedSave(false);
        }
    }, [debouncedSave])





    //ITEM AND KEY HANDLES
    const updateItem = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
        
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItem: Item = { id: Date.now(), isChecked: false, name: '', quantity: '', price: '' };

            const newItems = [...items];
            newItems.splice(index + 1, 0, newItem);
            setItems(newItems);

            setNeedSave(true);

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
        //console.log(items[index].name.length)
        if (items[index].name.length === 1 && items.length <= 1) {
            items[index].quantity = '';
            items[index].price = '';
        }
    }



    const Login = async () => {
        window.location.href = `/api/auth/login`;
    }

    const Logout = async () => {
        try {
            const response = await fetch(`/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
            if (response.ok) {
                //setUserData(null);
                setIsGuest(true);
                window.location.href = window.location.origin;
            }
        }
        catch (error) {
            console.log("Log out failed.", error);
        }
    }




    // CREATE AND DELETE LIST
    const CreateList = async () => {
        try {
            const payload = {
                Title: "New List"
            }
            const response = await fetch(`/api/shoplist/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                console.log("List Created Successfully.");
                allListRefetch();
            }
        }
        catch (error) {
            console.log("Create list failed.", error);
        }
    }

    const DeleteList = async (id: Number) => {
        try {
            const response = await fetch(`/api/shoplist/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (response.ok) {
                console.log("Successfully deleted.");
                allListRefetch();
            }
        }
        catch (error) {
            console.log("Delete list failed.", error);
        }
    }



    const firstLoad = async () => {
        try {
            const resp = await fetch(`/api/shoplist/init`, {
                method: "GET",
                credentials: "include"
            })

            if (resp.status != 200) {
                setIsGuest(true);
                return;
            }
            const data = resp.json();
            let user = null;
            let allLists = null;
            let currentList = null;

            if (data[1] != null) {
                user = data[0];
                allLists = data[1];
            }
            else {
                user = data;
            }
            if (data[2] != null) {
                currentList = data[2];
            }


            if (allLists != null) {
                if (allLists[0] != null) {
                    setListId(listId ? listId : allLists[0].id);
                } else {
                    CreateList();
                }
                setUserLists(allLists);
            }


            if (currentList != null) {
                const emptyRow: Item = {
                    id: Date.now(),
                    name: '',
                    quantity: '',
                    price: '',
                    isChecked: false
                }

                setListId(currentList.id);
                setListTitle(currentList.title);

                const safeData = Array.isArray(currentList.listedItems) ? currentList.listedItems : (currentList.listedItems?.items || []);
                const mappedItems = safeData.map((itemDB: any, index: number) => ({
                    id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,  //temp for unique ID
                    name: itemDB.name || '',
                    quantity: itemDB.quantity || '',
                    price: itemDB.price || '',
                    isChecked: itemDB.isChecked || false
                }));

                setItems([...mappedItems, emptyRow]);
                /* ADD EMPTY ROW AT ALL TIMES?
                if ([...mappedItems].length > 0) {
                    setItems([...mappedItems]);
                }
                else {
                    setItems([...mappedItems, emptyRow]);
                }*/
            }

            setIsGuest(false);
            
            return user;
        }
        catch (error) {
            console.log(error);
        }
    }

    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/auth/user`, {
                method: "GET",
                credentials: "include"
            })
            if (response.ok) {
                setIsGuest(false);
                return response.json();
            }
            else {
                setIsGuest(true);
            }
            
        }
        catch (error) {
            console.log("Fetch error.", error);
        }
    };

    const { data: user, isLoading: isGuestLoading } = useQuery({
        queryKey: ['startup'],
        queryFn: firstLoad,
        enabled: !!isGuest,
        refetchOnWindowFocus: false
    });

    
    /*const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
        enabled: !isGuestLoading,
        refetchOnWindowFocus: false
    }); */


    const { data: allLists, refetch: allListRefetch } = useQuery({
        queryKey: ['allLists'],
        queryFn: loadAllLists,
        enabled: !isGuestLoading && user != null,
        refetchOnWindowFocus: false
    });


    const {refetch: loadListRefetch } = useQuery({
        queryKey: ['list', listId],
        queryFn: () => loadList(listId),
        enabled: listId != null,
        refetchOnWindowFocus: false
    });



    //ADDS 1 LINE FOR GUESTS
    useEffect(() => {
        if (isGuest) {
            const emptyRow: Item = {
                id: Date.now(),
                name: '',
                quantity: '',
                price: '',
                isChecked: false
            }
            setItems([emptyRow]);
        }
    },[user])



    if (items) {
        return (
            <div className="fixed">
                
                

                <SidebarProvider defaultOpen={false}>
                    <SidebarInset>



                        <SidebarTrigger />

                        
                        <div className="w-full">
                            <div className="flex flex-row md:flex-row items-center justify-between gap-4 p-1">
                                <h2 className="whitespace-nowrap">{listId ? listTitle : "New List"}</h2>
                                <div className="flex flex-row gap-2">
                                    <Button disabled={isGuest ? true : false} onClick={() => setIsRenameOpen(true)}>Rename</Button>
                                    <Button disabled={isGuest ? true : false} onClick={() => setIsShareOpen(true) }>Share</Button>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center py-10 " >
                                {items?.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`flex flex-row items-center gap-1 p-0.5 
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
                                            maxLength={3}
                                            inputMode="decimal"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Tab' && e.key !== 'Backspace') { e.preventDefault(); }
                                                //handleKeyDown(e, index)
                                            }}
                                            className="w-1/8 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"

                                        />
                                        <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="$"
                                            value={item.price}
                                            inputMode="decimal"
                                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') { e.preventDefault(); }
                                                //handleKeyDown(e, index)
                                            }}
                                            className="w-1/8 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"

                                        />
                                    </div>
                                ))}
                            </div>
                        </div>




                        <div>
                            {isGuest ? <h2>Log in to save your lists!</h2> : ""}
                            <br/>
                            {user ? 
                                <Button onClick={() => Logout()}>Log out</Button>
                                : <Button onClick={() => Login()}>Log in with Google</Button>}
                            
                            <h2>{user?.name}, {user?.email}</h2>
                        </div>

                        <div className="fixed flex flex-row items-center justify-between gap-4 bottom-0 left-0 w-full p-5 border rounded-t-lg shadow-sm">
                            <div>
                                 <Button className="m-2">Btn</Button>
                            </div>
                            <div className="flex items-center gap-2 w-auto">
                                <input placeholder="a" className="border"/>
                                <Button className="m-2">Btn2</Button>
                            </div>
                        </div>



                        </SidebarInset>
                    <Sidebar>
                        <main>
                            <div className="flex flex-row md:flex-row">
                                <SidebarTrigger className="flex items-end" />
                                <Button disabled={isGuest ? true : false} onClick={() => CreateList() }>Create List</Button>
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                {userLists?.map((list) => (
                                    <li key={list.id}>
                                        <div className="flex flex-row md:flex-row">
                                        <CustomTrigger children={list.title} onClick={() => setListId(list.id)}></CustomTrigger>
                                            <Button onClick={() => {setListIdToDelete(list.id); setIsConfirmOpen(true); }}>X</Button>
                                        </div>
                                    </li>
                                )) }
                            </ul>
                            </main>
                        </Sidebar>
                    </SidebarProvider>

                <NameModal
                    isOpen={isRenameOpen}
                    onClose={() => setIsRenameOpen(false)}
                    onSubmit={handleNameSubmit}
                    currentValue={listTitle}
                />

                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onSubmit={handleConfirmSubmit}
                    listId={listIdToDelete}
                />

                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    onSubmit={handleShareSubmit}
                    listId={listId}
                />
            </div>
        )
        
    }
}

