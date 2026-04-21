"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { setPrinterConfig } from "@/lib/printing/printer-storage";

// ── Tipos ─────────────────────────────────────────────────────────

export type PrinterState =
  | "desconectado"
  | "conectando"
  | "conectado"
  | "imprimiendo"
  | "error"
  | "no_soportado";

export type UsePrinterReturn = {
  estado: PrinterState;
  nombreDispositivo: string | null;
  bluetoothDisponible: boolean;
  conectar: () => Promise<void>;
  desconectar: () => void;
  imprimir: (datos: Uint8Array) => Promise<void>;
};

// ── UUIDs conocidos para impresoras térmicas BLE ──────────────────

const PRINTER_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
const PRINTER_CHAR_UUID = "00002af1-0000-1000-8000-00805f9b34fb";

// Alternativas comunes
const ALT_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

// Tamaño máximo de chunk para BLE (evitar overflow del buffer)
const BLE_CHUNK_SIZE = 512;

// Reintentos de reconexión
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1000;

// ── Hook ──────────────────────────────────────────────────────────

export function usePrinter(sucursalId: string): UsePrinterReturn {
  const [estado, setEstado] = useState<PrinterState>(() => {
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      return "no_soportado";
    }
    return "desconectado";
  });

  const [nombreDispositivo, setNombreDispositivo] = useState<string | null>(
    null,
  );

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false);

  const bluetoothDisponible =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  // ── Desconexión ───────────────────────────────────────────────

  const desconectar = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    characteristicRef.current = null;
    setEstado("desconectado");
    setNombreDispositivo(null);
  }, []);

  // ── Handler de desconexión GATT ───────────────────────────────

  const handleDisconnected = useCallback(async () => {
    if (isReconnectingRef.current) return;

    characteristicRef.current = null;

    if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
      isReconnectingRef.current = true;
      setEstado("conectando");

      try {
        await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS));
        const device = deviceRef.current;
        if (!device?.gatt) throw new Error("Dispositivo no disponible");

        const server = await device.gatt.connect();
        const service = await discoverService(server);
        const characteristic = await discoverCharacteristic(service);

        characteristicRef.current = characteristic;
        reconnectAttemptsRef.current = 0;
        setEstado("conectado");
      } catch {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setEstado("error");
          setNombreDispositivo(null);
        }
      } finally {
        isReconnectingRef.current = false;
      }
    } else {
      setEstado("error");
      setNombreDispositivo(null);
    }
  }, []);

  // ── Descubrir servicio y característica ────────────────────────

  async function discoverService(
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTService> {
    // Intentar con el UUID principal
    for (const uuid of ALT_SERVICE_UUIDS) {
      try {
        return await server.getPrimaryService(uuid);
      } catch {
        // Intentar siguiente
      }
    }

    // Fallback: buscar todos los servicios disponibles
    const services = await server.getPrimaryServices();
    if (services.length > 0) {
      return services[0];
    }

    throw new Error("No se encontró servicio de impresión");
  }

  async function discoverCharacteristic(
    service: BluetoothRemoteGATTService,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    // Intentar UUID conocido
    try {
      return await service.getCharacteristic(PRINTER_CHAR_UUID);
    } catch {
      // Buscar cualquier característica escribible
    }

    const characteristics = await service.getCharacteristics();
    for (const char of characteristics) {
      if (char.properties.write || char.properties.writeWithoutResponse) {
        return char;
      }
    }

    throw new Error("No se encontró característica de escritura");
  }

  // ── Conexión ──────────────────────────────────────────────────

  const conectar = useCallback(async () => {
    if (!bluetoothDisponible) {
      setEstado("no_soportado");
      return;
    }

    setEstado("conectando");
    reconnectAttemptsRef.current = 0;

    try {
      // Solicitar dispositivo
      let device: BluetoothDevice;
      try {
        device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [PRINTER_SERVICE_UUID] }],
          optionalServices: ALT_SERVICE_UUIDS,
        });
      } catch {
        // Si falla con filtro, intentar aceptar todos los dispositivos
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ALT_SERVICE_UUIDS,
        });
      }

      // Limpiar dispositivo anterior
      if (deviceRef.current) {
        deviceRef.current.removeEventListener(
          "gattserverdisconnected",
          handleDisconnected,
        );
      }

      deviceRef.current = device;
      device.addEventListener("gattserverdisconnected", handleDisconnected);

      // Conectar GATT
      if (!device.gatt) throw new Error("GATT no disponible");
      const server = await device.gatt.connect();

      // Descubrir servicio y característica
      const service = await discoverService(server);
      const characteristic = await discoverCharacteristic(service);

      characteristicRef.current = characteristic;
      const nombre = device.name ?? "Impresora Bluetooth";
      setNombreDispositivo(nombre);
      setEstado("conectado");

      // Guardar nombre en storage
      setPrinterConfig(sucursalId, { deviceName: nombre });
    } catch (err) {
      const error = err as Error;
      const errorName = (error as { name?: string }).name;

      // Usuario canceló el selector
      if (errorName === "NotFoundError" || errorName === "AbortError") {
        setEstado("desconectado");
        return;
      }

      // Contexto no seguro (HTTP)
      if (errorName === "SecurityError") {
        setEstado("no_soportado");
        return;
      }

      setEstado("error");
    }
  }, [bluetoothDisponible, sucursalId, handleDisconnected]);

  // ── Impresión ─────────────────────────────────────────────────

  const imprimir = useCallback(async (datos: Uint8Array) => {
    const characteristic = characteristicRef.current;
    if (!characteristic) {
      throw new Error("Impresora no conectada");
    }

    setEstado("imprimiendo");

    try {
      // Enviar datos en chunks para evitar overflow del buffer BLE
      for (let offset = 0; offset < datos.length; offset += BLE_CHUNK_SIZE) {
        const chunk = datos.slice(offset, offset + BLE_CHUNK_SIZE);

        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else {
          await characteristic.writeValueWithResponse(chunk);
        }

        // Pequeña pausa entre chunks para que la impresora procese
        if (offset + BLE_CHUNK_SIZE < datos.length) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      setEstado("conectado");
    } catch {
      setEstado("error");
      throw new Error("Error al enviar datos a la impresora");
    }
  }, []);

  // ── Cleanup al desmontar ──────────────────────────────────────

  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.removeEventListener(
          "gattserverdisconnected",
          handleDisconnected,
        );
      }
    };
  }, [handleDisconnected]);

  return {
    estado,
    nombreDispositivo,
    bluetoothDisponible,
    conectar,
    desconectar,
    imprimir,
  };
}
