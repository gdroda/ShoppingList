/// <reference types="vite/client" />
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Button } from '@/components/ui/button.js';
import { Sidebar, SidebarTrigger, SidebarProvider, useSidebar, SidebarInset } from '@/components/ui/sidebar.js';
import { useDebounce } from './debounce.tsx';
import { NameModal, ShareModal } from './Modals.js';
import { ConfirmModal } from './ConfirmModal.js';
import { useNotificationSocket } from './SignalRNotifications.js';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface User { 
    name: string;
    email: string
    allLists: List[]
}

interface List {
    id: number,
    title: string,
    listedItems: Item[]
}

interface Item {
    id: string | number,
    isChecked: boolean,
    name: string,
    quantity: string,
    price: string,
    position: number
}

const emptyRow: Item = {
    id: `temp-${Date.now()}`,
    name: '',
    quantity: '',
    price: '',
    isChecked: false,
    position: -1
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

    const inputRefs = useRef([]);
    //const [userData, setUserData] = useState < User | null > (null);   REPLACED
    //const [isLoadings, setLoading] = useState(true);   NOT USED
    const [isGuest, setIsGuest] = useState(true);
    const [listId, setListId] = useState<number | null>();
    const [listTitle, setListTitle] = useState<string>();
    const [userLists, setUserLists] = useState([]);

    // REPLACED
    //const [items, setItems] = useState([
    //    { id: Date.now(), isChecked: false, name: '', quantity: '', price: '' }
    //]);

    const [items, setItems] = useState<Item[]>([]);
    //const [itemToUpdate, setItemToUpdate] = useState<Item>();

    const [changeSet, setChangeSet] = useState<Item[]>([]);
    const debouncedSave = useDebounce(changeSet, 500);
    const [needSave, setNeedSave] = useState(false);

    useNotificationSocket(listId, debouncedSave);
    const queryClient = useQueryClient();

    //MODALS
    //RENAMING SUBMIT
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const handleNameSubmit = async (newName: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/shoplist/rename/${listId}`, {
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


    



    //LIST LOADING
    const loadAllLists = async (): Promise<List[]> => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/shoplist`, {
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


    const loadList = async (id): Promise<List> => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/shoplist/${id}`, {
                method: "GET",
                credentials: "include"
            })

            const data = await resp.json();
            
            setListId(data.id);
            setListTitle(data.title);

            const safeData = Array.isArray(data.listedItems) ? data.listedItems : [];
            const mappedItems = safeData.map((itemDB: any, index: number) => ({
                id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,  //temp for unique ID
                name: itemDB.name || '',
                quantity: itemDB.quantity || '',
                price: itemDB.price || '',
                isChecked: itemDB.isChecked || false,
                position: itemDB.position
            }));

            const list: List = { id: data.id, title: data.title, listedItems: [...mappedItems, emptyRow] };

            return list;
        }
        catch (error) {
            console.log(error);
        }
    }





    // SAVE AND DEBOUNCE

    interface ItemToSendWithPositions {
        Id: number,
        Name: string,
        Price: number,
        Quantity: number,
        IsChecked: boolean,
        Position: any
    }


    const patchItem = useMutation({
        mutationFn: async (patchItems: Item[]) => {
            const payload = patchItems.map((item => ({
                Id: Number(item.id) || -1,
                Name: item.name,
                Price: Number(item.price) || 0,
                Quantity: Number(item.quantity) || 0,
                IsChecked: item.isChecked,
                Position: item.position
            })))
            const response = await fetch(`${BACKEND_URL}/api/shoplist/${listId}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        },
        /*onMutate: async (patchItem) => {
            await queryClient.cancelQueries({ queryKey: ['list', listId] })
            const previousList = queryClient.getQueryData(['list', listId])
            queryClient.setQueryData(['list', listId], (old: any) => {
                const safeOld = old?.listedItems || [];
                return {
                    ...old,
                    listedItems: safeOld?.map((item: Item) =>
                        item.id === patchItem.id ? { ...item, ...patchItem } : item
                    )
                }
            });
            return { previousList };
        },
        onError: (err, patchItem, context) => {
            if (context?.previousList) {
                queryClient.setQueryData(['list', listId], context.previousList);
            }
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['list', listId] })*/
        onSuccess: (returnedList) => {
            const safeData = Array.isArray(returnedList.listedItems) ? returnedList.listedItems : [];
            const mappedItems = safeData.map((itemDB: any, index: number) => ({
                id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,
                name: itemDB.name || '',
                quantity: itemDB.quantity || '',
                price: itemDB.price || '',
                isChecked: itemDB.isChecked || false,
                position: itemDB.position
            }));
            const list: List = { id: returnedList.id, title: returnedList.title, listedItems: [...mappedItems, emptyRow] };
            queryClient.setQueryData(['list', listId], list)
        }
    });

    const addItem = useMutation({
        mutationFn: async (newItem: ItemToSendWithPositions) => {
            const payload: ItemToSendWithPositions = {
                Id: Number(newItem.Id) || -1,
                Name: newItem.Name,
                Price: Number(newItem.Price) || 0,
                Quantity: Number(newItem.Quantity) || 0,
                IsChecked: newItem.IsChecked,
                Position: newItem.Position
            };
            const response = await fetch(`${BACKEND_URL}/api/shoplist/add/${listId}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        },
        /*onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: ['list', listId] })
            const previousList = queryClient.getQueryData(['list', listId])
            queryClient.setQueryData(['list', listId], (old: any) => {
                const safeOld = old?.listedItems || [];
                return {
                    ...old,
                    listedItems: [...safeOld, newItem]
                }
            });
            return { previousList };
        },
        onError: (err, newItem, context) => {
            if (context?.previousList) {
                queryClient.setQueryData(['list', listId], context.previousList);
            }
        },*/
        //onSettled: () =>
            //queryClient.invalidateQueries({ queryKey: ['list', listId] }),
        onSuccess: (returnedList) => {
            const safeData = Array.isArray(returnedList.listedItems) ? returnedList.listedItems : [];
            const mappedItems = safeData.map((itemDB: any, index: number) => ({
                id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,
                name: itemDB.name || '',
                quantity: itemDB.quantity || '',
                price: itemDB.price || '',
                isChecked: itemDB.isChecked || false,
                position: itemDB.position
            }));
            const list: List = { id: returnedList.id, title: returnedList.title, listedItems: [...mappedItems, emptyRow] };
            queryClient.setQueryData(['list', listId], list)
        }
    })

    const removeItem = useMutation({
        mutationFn: async (deleteItem: Item) => {
            if (deleteItem.id.toString().startsWith("temp")) return null;

            const response = await fetch(`${BACKEND_URL}/api/shoplist/remove/${listId}/${deleteItem.id}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        },
        onMutate: async (deleteItem) => {
            await queryClient.cancelQueries({ queryKey: ['list', listId] })
            const previousList = queryClient.getQueryData(['list', listId])
            queryClient.setQueryData(['list', listId], (old: any) => {
                const safeOld = old?.listedItems || [];
                const filteredData = safeOld.filter(i => i.id !== deleteItem.id);
                return {
                    ...old,
                    listedItems: filteredData
                }
            });
            return { previousList };
        },
        onError: (err, deleteItem, context) => {
            if (context?.previousList) {
                queryClient.setQueryData(['list', listId], context.previousList);
            }
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['list', listId] })
    })
    

    useEffect(() => {
        if (!isGuest && needSave) {
            if (changeSet.length > 0) {
                patchItem.mutate(changeSet);
                setChangeSet([]);
                setNeedSave(false);
            }
        }
    }, [debouncedSave])




    const [focusIndex, setFocusIndex] = useState<number>();
    useEffect(() => {
        if (focusIndex !== undefined && focusIndex !== null) {
            inputRefs.current[focusIndex]?.focus();
        }
    },[items, focusIndex])


    //ITEM UPDATES AND KEY HANDLES
    const updateItem = (id, field, value, index) => {
        const updatedList = items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );

        const updatedItem = updatedList.find(item => item.id == id);

        setFocusIndex(index);

        setItems(updatedList);
        if (updatedItem && !id.toString().startsWith("temp")) {
            //setItemToUpdate(updatedItem);
            setChangeSet(prev => [...prev, updatedItem])
            setNeedSave(true);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const currentItem = items[index];
            if (currentItem.position === -1.0) {
                if (items.length === 1) {
                    currentItem.position = 1.0;
                } else {
                    currentItem.position = items[index - 1].position + 1.0;
                }
            }
            if (currentItem.name && currentItem.name.trim() !== "") {
                if (currentItem.id.toString().startsWith("temp")) {
                    addItem.mutate({
                        Id: Number(currentItem.id),
                        Name: currentItem.name,
                        Price: Number(currentItem.price) || 0,
                        Quantity: Number(currentItem.quantity) || 0,
                        IsChecked: currentItem.isChecked,
                        Position: currentItem.position
                    }); //is this fine?
                }

                setFocusIndex(index + 1);

                const nextItem = items[index + 1];
                const abovePos = currentItem.position;
                const belowPos = nextItem ? nextItem.position : null;

                let newPosition;
                if (belowPos === null || belowPos === -1.0) {
                    newPosition = abovePos + 1.0;
                } else {
                    newPosition = (abovePos + belowPos) / 2.0;
                }

                const newItem: Item = { id: `temp-${index}-${Date.now()}`, isChecked: false, name: '', quantity: '', price: '', position: newPosition };
                const newItems = [...items];
                newItems.splice(index + 1, 0, newItem);
                setItems(newItems);

                
                // Focus the new input on the next render
                //setTimeout(() => {
                    //if (inputRefs.current[index + 1]) {
                        //setFocusIndex(index + 1);
                        //console.log(index + 1);
                        //inputRefs.current[index + 1].focus();
                    //}
                //}, 10);
            }
        }


        if (e.key === 'Backspace' && items[index].name === '' && items.length > 1) {
            e.preventDefault();
            setFocusIndex(index - 1);

            if (!items[index].id.toString().startsWith("temp")) {
                removeItem.mutate(items[index]);
            }
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            //if (inputRefs.current[index - 1]) {
            //    inputRefs.current[index - 1].focus();
            //}
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
        window.location.href = `${BACKEND_URL}/api/auth/login`;
    }

    const Logout = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
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
            const response = await fetch(`${BACKEND_URL}/api/shoplist/`, {
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
            const response = await fetch(`${BACKEND_URL}/api/shoplist/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (response.ok) {
                console.log("Successfully deleted.");
                //setListId(null);
                allListRefetch();
            }
        }
        catch (error) {
            console.log("Delete list failed.", error);
        }
    }



    const firstLoad = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/shoplist/init`, {
                method: "GET",
                credentials: "include"
            })

            if (resp.status === 401) {
                window.location.href = `${BACKEND_URL}/api/auth/login`;
                return;
            }else if (!resp.ok) {
                setIsGuest(true);
                return;
            }
            const data = await resp.json() as unknown as User;


            if (data.allLists.length > 0) {
                if (data.allLists[0] != null) {
                    setListId(listId ? listId : data.allLists[0].id);
                } else {
                    CreateList();
                }
                setUserLists(data.allLists);
            }


            if (data.allLists[0] != null) {
                const currentList: List = data.allLists[0];
                setListId(currentList.id);
                setListTitle(currentList.title);

                const safeData = Array.isArray(currentList.listedItems) ? currentList.listedItems : [];
                const mappedItems = safeData.map((itemDB: any, index: number) => ({
                    id: itemDB.id === 0 ? `temp-${index}-${Date.now()}` : itemDB.id,  //temp for unique ID
                    name: itemDB.name || '',
                    quantity: itemDB.quantity || '',
                    price: itemDB.price || '',
                    isChecked: itemDB.isChecked || false,
                    position: itemDB.position
                }));

                setItems([...mappedItems, emptyRow]);

                /*
                if ([...mappedItems].length > 0) {
                    setItems([...mappedItems]);
                }
                else {
                    setItems([...mappedItems, emptyRow]);
                }*/
            }

            setIsGuest(false);
            return data;
        }
        catch (error) {
            console.log(error);
        }
    }

    /*
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
    };*/

    const { data: userData } = useQuery({
        queryKey: ['user'],
        queryFn: firstLoad,
        enabled: !!isGuest
    });

    /*
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
        enabled: !!isGuest
    }); */


    const { data: allLists, refetch: allListRefetch } = useQuery({
        queryKey: ['allLists'],
        queryFn: loadAllLists,
        enabled: false,
        refetchOnWindowFocus: false
    });


    const {data: serverList, refetch: loadListRefetch } = useQuery({
        queryKey: ['list', listId],
        queryFn: () => loadList(listId),
        enabled: !!listId,
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        const isUserTyping = addItem.isPending || removeItem.isPending || patchItem.isPending;
        
        if (serverList && !isUserTyping) {
            //setItems(serverList.listedItems);
        }
    },[serverList, addItem.isPending, removeItem.isPending, patchItem.isPending])


    //ADDS 1 LINE FOR GUESTS
    useEffect(() => {
        if (isGuest) {
            setItems([emptyRow]);
        }
    }, [userData])


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
                                ${item.isChecked ? `line-through text-gray-400 bg-[oklch(0.95_0.02_87)]` : `text-gray-900`}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={item.isChecked}
                                            onChange={(e) => updateItem(item.id, 'isChecked', e.target.checked, index)}
                                            className="w-1/8 accent-black"
                                        />
                                        <input
                                            ref={el => { if (el) { inputRefs.current[index] = el; } else { delete inputRefs.current[index] } }}
                                            type="text"
                                            value={item.name}
                                            placeholder="Item name..."
                                            spellCheck="false"
                                            onChange={(e) => { updateItem(item.id, 'name', e.target.value, index); handleChange(e, index); }}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            enterKeyHint="enter"
                                            className="w-full px-2 py-1 border-b-2 border-gray-400 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Qty"
                                            maxLength={3}
                                            inputMode="decimal"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value, index)}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Tab' && e.key !== 'Backspace') { e.preventDefault(); }
                                                //handleKeyDown(e, index)
                                            }}
                                            className="w-1/8 px-2 py-1 border-b-2 border-gray-400 focus:outline-none"

                                        />
                                        <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="$"
                                            value={item.price}
                                            inputMode="decimal"
                                            onChange={(e) => updateItem(item.id, 'price', e.target.value, index)}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') { e.preventDefault(); }
                                                //handleKeyDown(e, index)
                                            }}
                                            className="w-1/8 px-2 py-1 border-b-2 border-gray-400 focus:outline-none"

                                        />
                                    </div>
                                ))}
                            </div>
                        </div>




                        <div>
                            {isGuest ? <h2>Log in to save your lists!</h2> : ""}
                            <br/>
                            {userData ? 
                                <Button onClick={() => Logout()}>Log out</Button>
                                : <Button onClick={() => Login()}>Log in with Google</Button>}
                            
                            <h2>{userData?.name}, {userData?.email}</h2>
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
                                            <CustomTrigger children={list.title} onClick={() => { setListId(list.id); /*loadListRefetch();*/ }}></CustomTrigger>
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

