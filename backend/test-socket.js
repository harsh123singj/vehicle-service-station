import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("✅ Connected to server");
    console.log("Socket ID:", socket.id);
});

socket.on("test:event", (data) => {
    console.log("🧪 TEST EVENT RECEIVED");
    console.log(data);
});

socket.on("journey:created", (data) => {
    console.log("🚗🚗🚗 JOURNEY CREATED EVENT RECEIVED 🚗🚗🚗");
    console.log(data);
});

socket.on("journey:exited", (data) => {
    console.log("🚪 JOURNEY EXITED EVENT RECEIVED");
    console.log(data);
});

socket.on("journey:service-started", (data) => {
    console.log("🔧 SERVICE STARTED EVENT RECEIVED");
    console.log(data);
});

socket.on("journey:service-completed", (data) => {
    console.log("✅ SERVICE COMPLETED EVENT RECEIVED");
    console.log(data);
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});

socket.on("connect_error", (error) => {
    console.log("❌ Connection error:", error.message);
});

socket.onAny((event, ...args) => {
    console.log("📡 EVENT RECEIVED:", event);
    console.log("📦 DATA:", args);
});