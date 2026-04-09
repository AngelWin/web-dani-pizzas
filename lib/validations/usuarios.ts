import { z } from "zod";

export const repartidorDetallesSchema = z.object({
  direccion: z
    .string()
    .max(300, "Máximo 300 caracteres")
    .nullable()
    .transform((v) => v || null),
  tipo_vehiculo: z.array(z.enum(["auto", "motocar", "moto_lineal"])),
  notas: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .nullable()
    .transform((v) => v || null),
});

export type RepartidorDetallesFormData = z.infer<
  typeof repartidorDetallesSchema
>;

export const crearUsuarioSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellido_paterno: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellido_materno: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .nullable()
    .transform((v) => v || null),
  rol_id: z.string().uuid("Selecciona un rol"),
  sucursal_id: z
    .string()
    .nullable()
    .transform((v) => v || null),
  repartidor_detalles: repartidorDetallesSchema.nullable().optional(),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellido_paterno: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellido_materno: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .nullable()
    .transform((v) => v || null),
  rol_id: z.string().uuid("Selecciona un rol"),
  sucursal_id: z
    .string()
    .nullable()
    .transform((v) => v || null),
  estado: z.enum(["activo", "inactivo", "eliminado"]),
  repartidor_detalles: repartidorDetallesSchema.nullable().optional(),
});

export const cambiarContrasenaSchema = z
  .object({
    nueva_password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
    confirmar_password: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((d) => d.nueva_password === d.confirmar_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_password"],
  });

export const actualizarNombreSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellido_paterno: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "Máximo 100 caracteres"),
});

export type CrearUsuarioFormData = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioFormData = z.infer<typeof actualizarUsuarioSchema>;
export type CambiarContrasenaFormData = z.infer<typeof cambiarContrasenaSchema>;
export type ActualizarNombreFormData = z.infer<typeof actualizarNombreSchema>;
