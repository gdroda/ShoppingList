import * as signalR from "@microsoft/signalr";
import { useEffect, useState, useRef } from "react";

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const useNotificationSocket = (listId: number | null, debounce) => {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${FRONTEND_URL}/hub`)
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                connectionRef.current = connection;
                setIsReady(true);
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        return () => {
            connection?.stop();
        }
    }, []);

    useEffect(() => {
        const conn = connectionRef.current;

        if (isReady && conn?.state === signalR.HubConnectionState.Connected && listId) {
            conn.send("JoinNotificationGroup", listId)
                .catch(err => console.error("Join Group Error: ", err));
        }
        return () => {
            if (conn?.state === signalR.HubConnectionState.Connected) {
                conn.send("LeaveNotificationGroup", listId);
            }
        };
    }, [isReady, listId]);

    useEffect(() => {
        const conn = connectionRef.current;

        if (isReady && conn?.state === signalR.HubConnectionState.Connected && listId) {
            const handleNotification = (userName: string, id: number) => {
                console.log(`Notification received for list ${id}`);
            }
            conn.on("NewNotification", handleNotification);

            return () => {
                conn.off("NewNotification", handleNotification);
                };
            }
    }, [debounce])
};
