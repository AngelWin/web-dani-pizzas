"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { Bike } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  type CrearUsuarioFormData,
  type ActualizarUsuarioFormData,
  type RepartidorDetallesFormData,
} from "@/lib/validations/usuarios";
import type { Control } from "react-hook-form";
import {
  crearUsuarioAction,
  actualizarUsuarioAction,
} from "@/actions/usuarios";
import type { UsuarioCompleto, Rol, Sucursal } from "@/lib/services/usuarios";
import { TIPOS_VEHICULO_LABELS, type TipoVehiculo } from "@/lib/constants";

const ESTADOS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

const TIPOS_VEHICULO_OPTIONS = Object.entries(TIPOS_VEHICULO_LABELS) as [
  TipoVehiculo,
  string,
][];

// Tipo mínimo compartido por ambos formularios (crear y actualizar)
type FormWithRepartidor = {
  repartidor_detalles?: RepartidorDetallesFormData | null;
};

/** Sección condicional con los campos de repartidor */
function RepartidorDetallesFields({
  control,
}: {
  control: Control<FormWithRepartidor>;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface/50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Bike className="h-4 w-4" />
        Detalles de repartidor
      </div>

      <FormField
        control={control}
        name="repartidor_detalles.direccion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Direccion</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                maxLength={300}
                placeholder="Av. Ejemplo 123, Casma"
                className="h-11 rounded-xl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="repartidor_detalles.tipo_vehiculo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de vehiculo</FormLabel>
            <div className="flex flex-wrap gap-4 pt-1">
              {TIPOS_VEHICULO_OPTIONS.map(([value, label]) => {
                const checked =
                  (field.value as string[] | undefined)?.includes(value) ??
                  false;
                return (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        const current = (field.value as string[]) ?? [];
                        field.onChange(
                          isChecked
                            ? [...current, value]
                            : current.filter((v: string) => v !== value),
                        );
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="repartidor_detalles.notas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notas (opcional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                maxLength={500}
                placeholder="Observaciones adicionales..."
                className="min-h-[80px] rounded-xl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// ─── Formulario de creación ───────────────────────────────────────────────────

type CrearProps = {
  roles: Rol[];
  sucursales: Sucursal[];
  onSuccess?: () => void;
};

export function CrearUsuarioForm({ roles, sucursales, onSuccess }: CrearProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CrearUsuarioFormData>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      email: "",
      password: "",
      nombre: "",
      apellido_paterno: "",
      apellido_materno: null,
      rol_id: "",
      sucursal_id: null,
      repartidor_detalles: null,
    },
  });

  const watchedRolId = form.watch("rol_id");
  const isRepartidor =
    roles.find((r) => r.id === watchedRolId)?.nombre === "repartidor";

  function onSubmit(values: CrearUsuarioFormData) {
    startTransition(async () => {
      const result = await crearUsuarioAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuario creado correctamente");
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido_paterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido paterno</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="apellido_materno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido materno (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electronico</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="off"
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrasena inicial</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rol_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    const selected = roles.find((r) => r.id === v);
                    if (selected?.nombre !== "repartidor") {
                      form.setValue("repartidor_detalles", null);
                    } else {
                      form.setValue("repartidor_detalles", {
                        direccion: null,
                        tipo_vehiculo: [],
                        notas: null,
                      });
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sucursal_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sucursal</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sin sucursal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin sucursal</SelectItem>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isRepartidor && (
          <RepartidorDetallesFields
            control={form.control as unknown as Control<FormWithRepartidor>}
          />
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 px-6 rounded-xl"
          >
            {isPending ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Formulario de edicion ────────────────────────────────────────────────────

type EditarProps = {
  usuario: UsuarioCompleto;
  roles: Rol[];
  sucursales: Sucursal[];
  repartidorDetalles?: {
    direccion: string | null;
    tipo_vehiculo: string[] | null;
    notas: string | null;
  } | null;
  onSuccess?: () => void;
};

export function EditarUsuarioForm({
  usuario,
  roles,
  sucursales,
  repartidorDetalles,
  onSuccess,
}: EditarProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ActualizarUsuarioFormData>({
    resolver: zodResolver(actualizarUsuarioSchema),
    defaultValues: {
      nombre: usuario.nombre,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno ?? null,
      rol_id: usuario.rol_id ?? "",
      sucursal_id: usuario.sucursal_id ?? null,
      estado: usuario.estado,
      repartidor_detalles: repartidorDetalles
        ? {
            direccion: repartidorDetalles.direccion ?? null,
            tipo_vehiculo:
              (repartidorDetalles.tipo_vehiculo as TipoVehiculo[]) ?? [],
            notas: repartidorDetalles.notas ?? null,
          }
        : null,
    },
  });

  const watchedRolId = form.watch("rol_id");
  const isRepartidor =
    roles.find((r) => r.id === watchedRolId)?.nombre === "repartidor";

  function onSubmit(values: ActualizarUsuarioFormData) {
    startTransition(async () => {
      const result = await actualizarUsuarioAction(usuario.id, values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuario actualizado");
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido_paterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido paterno</FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="apellido_materno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido materno (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rol_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    const selected = roles.find((r) => r.id === v);
                    if (selected?.nombre !== "repartidor") {
                      form.setValue("repartidor_detalles", null);
                    } else if (!form.getValues("repartidor_detalles")) {
                      form.setValue("repartidor_detalles", {
                        direccion: null,
                        tipo_vehiculo: [],
                        notas: null,
                      });
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sucursal_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sucursal</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sin sucursal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin sucursal</SelectItem>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isRepartidor && (
          <RepartidorDetallesFields
            control={form.control as unknown as Control<FormWithRepartidor>}
          />
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 px-6 rounded-xl"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
