"""
Launcher script for Cottonil Executive Dashboard.
Run this script to launch the local web server.
"""
import socket
import uvicorn

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def find_available_port(start_port: int = 8000, max_attempts: int = 10) -> int:
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    return start_port

if __name__ == "__main__":
    port = find_available_port(8000)
    print("=====================================================================")
    print(" Cottonil Executive Dashboard & Sales Forecasting Suite")
    print(" Designed with Cottonil brand identity (Navy/Royal Blue & Pure White)")
    print(f" Access URL: http://127.0.0.1:{port}")
    print("=====================================================================")
    uvicorn.run("dashboard.app:app", host="127.0.0.1", port=port, reload=False)

